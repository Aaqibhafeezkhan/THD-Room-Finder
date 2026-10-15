import type { FocusClient } from './supabaseClient';

/**
 * Sign-in and study profile calls against the focus service
 * (docs/architecture/focus-service.md). Errors come back as the service's
 * `hint` codes so screens can word them; transport errors become `network`.
 */
export interface Programme {
  id: string;
  code: string;
  nameEn: string;
  nameDe: string;
  intakeTerms: ('winter' | 'summer')[];
}

export interface Identity {
  displayName: string | null;
  programmeId: string | null;
  intakeYear: number | null;
  intakeTerm: 'winter' | 'summer' | null;
  defaultVisibility: 'private' | 'public';
  showName: boolean;
  version: number;
}

export type IdentityInput = Omit<Identity, 'version'>;

export class ServiceError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = 'ServiceError';
  }
}

export interface IdentityApi {
  /** Email of the signed-in account, or null. */
  currentEmail(): Promise<string | null>;
  onAuthChange(cb: (email: string | null) => void): () => void;
  sendCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
  programmes(): Promise<Programme[]>;
  getIdentity(): Promise<Identity | null>;
  saveIdentity(input: IdentityInput, expectedVersion: number | null): Promise<Identity>;
  deleteIdentity(): Promise<void>;
}

function toIdentity(j: Record<string, unknown> | null): Identity | null {
  if (!j) return null;
  return {
    displayName: (j.display_name as string | null) ?? null,
    programmeId: (j.programme_id as string | null) ?? null,
    intakeYear: (j.intake_year as number | null) ?? null,
    intakeTerm: (j.intake_term as Identity['intakeTerm']) ?? null,
    defaultVisibility: j.default_visibility === 'public' ? 'public' : 'private',
    showName: Boolean(j.show_name),
    version: Number(j.version ?? 1),
  };
}

/** Maps a PostgREST or Auth error to a short code the UI can word. */
export function errorCode(err: { hint?: string | null; code?: string; status?: number; message?: string } | null): string {
  if (!err) return 'unknown';
  if (err.hint) return err.hint;
  if (err.code === 'otp_expired') return 'code_expired';
  if (err.status === 429 || err.code === 'over_email_send_rate_limit') return 'rate_limited';
  if (err.code === '42501') return 'not_signed_in';
  if (/fetch|network/i.test(err.message ?? '')) return 'network';
  return err.code ?? 'unknown';
}

export function supabaseIdentityApi(load: () => Promise<FocusClient>): IdentityApi {
  return {
    async currentEmail() {
      const sb = await load();
      const { data } = await sb.auth.getSession();
      return data.session?.user.email ?? null;
    },
    onAuthChange(cb) {
      let stop = false;
      let unsubscribe = () => {};
      void load().then((sb) => {
        if (stop) return;
        const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session?.user.email ?? null));
        unsubscribe = () => data.subscription.unsubscribe();
      });
      return () => {
        stop = true;
        unsubscribe();
      };
    },
    async sendCode(email) {
      const sb = await load();
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw new ServiceError(errorCode(error));
    },
    async verifyCode(email, code) {
      const sb = await load();
      const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw new ServiceError(errorCode(error));
    },
    async signOut() {
      const sb = await load();
      await sb.auth.signOut();
    },
    async programmes() {
      const sb = await load();
      const { data, error } = await sb.rpc('list_programmes');
      if (error) throw new ServiceError(errorCode(error));
      return (data ?? []).map((p) => ({
        id: p.id,
        code: p.code,
        nameEn: p.name_en,
        nameDe: p.name_de,
        intakeTerms: p.intake_terms.filter((t): t is 'winter' | 'summer' => t === 'winter' || t === 'summer'),
      }));
    },
    async getIdentity() {
      const sb = await load();
      const { data, error } = await sb.rpc('get_identity');
      if (error) throw new ServiceError(errorCode(error));
      return toIdentity(data as Record<string, unknown> | null);
    },
    async saveIdentity(input, expectedVersion) {
      const sb = await load();
      const { data, error } = await sb.rpc('save_identity', {
        p_display_name: input.displayName ?? '',
        p_programme_id: input.programmeId as string,
        p_intake_year: input.intakeYear as number,
        p_intake_term: input.intakeTerm as string,
        p_default_visibility: input.defaultVisibility,
        p_show_name: input.showName,
        ...(expectedVersion != null ? { p_expected_version: expectedVersion } : {}),
      });
      if (error) throw new ServiceError(errorCode(error));
      return toIdentity(data as Record<string, unknown>) as Identity;
    },
    async deleteIdentity() {
      const sb = await load();
      const { error } = await sb.rpc('delete_identity');
      if (error) throw new ServiceError(errorCode(error));
    },
  };
}
