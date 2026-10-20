import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Button, Sheet } from '../../components';
import { ServiceError } from '../../data/identityApi';
import type { Programme } from '../../data/identityApi';
import { batchLabel, recentIntakes } from '../../domain/batch';
import type { Intake } from '../../domain/batch';
import { useI18n } from '../../i18n';
import type { Translate } from '../../i18n';
import { useWindowClass } from '../../lib/useWindowClass';
import { Radio } from '../shared/Radio';
import { useStudyProfile } from './StudyProfileContext';

/**
 * Study profile setup (D2): one question per step, a bottom sheet on phones
 * and a 480 px dialog from tablet up. Email → code → programme → intake →
 * optional name → what others see. A returning student whose profile already
 * exists is done after the code. Signed-in students editing their profile
 * start at the programme. "Not listed" keeps the student Private-only.
 * `quick` is the study table path (ADR 0007): email → code → first name,
 * saved as a Private profile without a programme; programme and batch can
 * be added later in Profile.
 */
type Step = 'email' | 'code' | 'programme' | 'intake' | 'name' | 'visibility';
const ORDER: Step[] = ['email', 'code', 'programme', 'intake', 'name', 'visibility'];
const QUICK_ORDER: Step[] = ['email', 'code', 'name'];

export interface SetupSheetProps {
  open: boolean;
  onClose: () => void;
  onDone?: (message: string) => void;
  /** Email, code and a first name only; for taking a seat at a table. */
  quick?: boolean;
}

const field: CSSProperties = {
  width: '100%',
  minHeight: 48,
  boxSizing: 'border-box',
  padding: '0 14px',
  borderRadius: 'var(--radius-s)',
  border: '1px solid var(--md-outline)',
  background: 'var(--md-surface)',
  color: 'var(--md-on-surface)',
  fontSize: 'var(--body-large-size)',
  fontFamily: 'var(--font-sans)',
};

function errorText(code: string, t: Translate): string {
  switch (code) {
    case 'code_expired':
      return t("That code didn't work or has expired. Check it, or send a new one.", 'Der Code passt nicht oder ist abgelaufen. Prüfe ihn oder fordere einen neuen an.');
    case 'rate_limited':
      return t('Too many codes in a short time. Wait a minute and try again.', 'Zu viele Codes in kurzer Zeit. Warte eine Minute und versuche es erneut.');
    case 'network':
      return t("You're offline. Your timer still works; try again when you're back online.", 'Du bist offline. Dein Timer funktioniert trotzdem; versuche es wieder, wenn du online bist.');
    case 'blocked':
      return t(
        "Couldn't reach the sign-in server. An ad blocker or Brave Shields may be stopping it; allow this site and try again.",
        'Der Anmeldeserver ist nicht erreichbar. Vielleicht blockiert ihn ein Werbeblocker oder Brave Shields; erlaube diese Seite und versuche es erneut.',
      );
    case 'stale_version':
      return t('Your profile changed on another device. Close this and try again.', 'Dein Profil wurde auf einem anderen Gerät geändert. Schließe das hier und versuche es erneut.');
    case 'invalid_programme':
      return t("That programme can't start in this term. Pick another intake.", 'Dieser Studiengang beginnt nicht in diesem Semester. Wähle einen anderen Studienbeginn.');
    default:
      return t('Something went wrong. Try again.', 'Etwas ist schiefgelaufen. Versuche es erneut.');
  }
}

export function SetupSheet({ open, onClose, onDone, quick = false }: SetupSheetProps) {
  const { t, locale } = useI18n();
  const cls = useWindowClass();
  const profile = useStudyProfile();
  const signedIn = Boolean(profile.email);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [query, setQuery] = useState('');
  const [programme, setProgramme] = useState<Programme | null | 'other'>(null);
  const [intake, setIntake] = useState<Intake | null>(null);
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Each time the sheet opens, start where this student needs to and prefill
  // what they already set.
  useEffect(() => {
    if (!open) return;
    const id = profile.identity;
    setStep(signedIn ? (quick ? 'name' : 'programme') : 'email');
    setCode('');
    setQuery('');
    setError('');
    setProgramme(id ? (profile.programme ?? (id.programmeId ? null : 'other')) : null);
    setIntake(id?.intakeYear && id.intakeTerm ? { year: id.intakeYear, term: id.intakeTerm } : null);
    setName(id?.displayName ?? '');
    setVisibility(id?.defaultVisibility ?? 'private');
    // Only on open; later profile updates must not reset the steps.
  }, [open]);

  // Focus moves to the step title on every step (D2).
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (open) heading.current?.focus();
  }, [step, open]);

  const now = useMemo(() => new Date(), [open]);
  const listed = programme && programme !== 'other' ? programme : null;
  const intakes = useMemo(() => (listed ? recentIntakes(now, listed.intakeTerms) : []), [listed, now]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = profile.programmes;
    if (!q) return all;
    return all.filter((p) => [p.code, p.nameEn, p.nameDe].some((s) => s.toLowerCase().includes(q)));
  }, [query, profile.programmes]);

  const go = (s: Step) => {
    setError('');
    setStep(s);
  };
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(errorText(e instanceof ServiceError ? e.code : 'unknown', t));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      await profile.api!.sendCode(email.trim());
      setCode('');
      go('code');
    });
  const verify = () =>
    run(async () => {
      await profile.api!.verifyCode(email.trim(), code.trim());
      // A returning student already has a profile on the service: it is now
      // loaded on this device, so there is nothing left to ask.
      if (await profile.refresh()) {
        onClose();
        onDone?.(t('Signed in · profile synced', 'Angemeldet · Profil synchronisiert'));
        return;
      }
      go(quick ? 'name' : 'programme');
    });
  const save = () =>
    run(async () => {
      await profile.save({
        displayName: name.trim() || null,
        programmeId: listed?.id ?? null,
        intakeYear: listed ? (intake?.year ?? null) : null,
        intakeTerm: listed ? (intake?.term ?? null) : null,
        defaultVisibility: listed ? visibility : 'private',
        showName: profile.identity?.showName ?? false,
      });
      onClose();
      onDone?.(t('Study profile saved', 'Studienprofil gespeichert'));
    });

  const batch = listed && intake ? batchLabel(listed.code, intake, now) : null;
  const termName = (i: Intake) =>
    i.term === 'winter' ? t(`Winter ${i.year}/${String(i.year + 1).slice(2)}`, `Winter ${i.year}/${String(i.year + 1).slice(2)}`) : t(`Summer ${i.year}`, `Sommer ${i.year}`);

  const order = quick ? QUICK_ORDER : ORDER;
  const index = order.indexOf(step) + 1;
  const title = {
    email: t("What's your THD email?", 'Wie lautet deine THD-E-Mail?'),
    code: t('Enter the code', 'Code eingeben'),
    programme: t('What do you study?', 'Was studierst du?'),
    intake: t('When did you start?', 'Wann hast du angefangen?'),
    name: quick ? t("What's your first name?", 'Wie ist dein Vorname?') : t('What should your batch call you?', 'Wie soll dein Jahrgang dich nennen?'),
    visibility: t('This is what others see', 'Das sehen andere'),
  }[step];

  const back = () => {
    const prev: Partial<Record<Step, Step>> = {
      code: 'email',
      intake: 'programme',
      name: quick ? undefined : listed ? 'intake' : 'programme',
      visibility: 'name',
    };
    const p = prev[step];
    if (p) go(p);
    else onClose();
  };

  const primary = (label: string, onClick: () => void, disabled = false) => (
    <Button variant="filled" disabled={busy || disabled} onClick={onClick} style={{ width: '100%', minHeight: 48 }}>
      {label}
    </Button>
  );

  let body: ReactNode;
  if (step === 'email') {
    body = (
      <>
        <p style={sub}>{t('We send you a code. No password.', 'Wir schicken dir einen Code. Kein Passwort.')}</p>
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-label={t('Email', 'E-Mail')}
          placeholder="name@stud.th-deg.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && /\S+@\S+\.\S+/.test(email) && sendCode()}
          style={field}
        />
        {primary(t('Send Code', 'Code senden'), sendCode, !/\S+@\S+\.\S+/.test(email))}
      </>
    );
  } else if (step === 'code') {
    body = (
      <>
        <p style={sub}>{t(`Sent to ${email}. It expires in 10 minutes.`, `Gesendet an ${email}. Er läuft in 10 Minuten ab.`)}</p>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={t('Code', 'Code')}
          maxLength={10}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && code.length >= 6 && verify()}
          style={{ ...field, fontFamily: 'var(--font-mono)', letterSpacing: '0.3em', fontSize: 24 }}
        />
        {primary(t('Continue', 'Weiter'), verify, code.length < 6)}
        <Button variant="text" disabled={busy} onClick={sendCode} style={{ width: '100%' }}>
          {t('Resend Code', 'Code erneut senden')}
        </Button>
      </>
    );
  } else if (step === 'programme') {
    body = (
      <>
        <input
          type="search"
          aria-label={t('Search programmes', 'Studiengänge suchen')}
          placeholder={t('Search, e.g. AIN', 'Suchen, z. B. AIN')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={field}
        />
        <div role="radiogroup" aria-label={title} style={{ maxHeight: 280, overflowY: 'auto' }}>
          {matches.map((p) => (
            <Radio key={p.id} checked={listed?.id === p.id} onSelect={() => setProgramme(p)} trailing={p.code}>
              {locale === 'de' ? p.nameDe : p.nameEn}
            </Radio>
          ))}
          <Radio checked={programme === 'other'} onSelect={() => setProgramme('other')}>
            {t('Other / not listed', 'Anderer / nicht gelistet')}
          </Radio>
        </div>
        {programme === 'other' && (
          <p style={sub}>
            {t(
              'Focus sessions still work. Sharing with a batch needs a listed programme, so your sessions stay Private.',
              'Fokus-Sessions funktionieren trotzdem. Teilen mit dem Jahrgang braucht einen gelisteten Studiengang, deine Sessions bleiben also privat.',
            )}
          </p>
        )}
        {primary(t('Next', 'Weiter'), () => go(listed ? 'intake' : 'name'), !programme)}
      </>
    );
  } else if (step === 'intake') {
    body = (
      <>
        <div role="radiogroup" aria-label={title} style={{ maxHeight: 320, overflowY: 'auto' }}>
          {intakes.map((i) => (
            <Radio
              key={`${i.year}-${i.term}`}
              checked={intake?.year === i.year && intake.term === i.term}
              onSelect={() => setIntake(i)}
              trailing={listed ? batchLabel(listed.code, i, now) : undefined}
            >
              {termName(i)}
            </Radio>
          ))}
        </div>
        <p style={sub}>
          {t(
            'Your batch number goes up by itself each term.',
            'Die Zahl deines Jahrgangs steigt jedes Semester von selbst.',
          )}
        </p>
        {primary(t('Next', 'Weiter'), () => go('name'), !intake)}
      </>
    );
  } else if (step === 'name') {
    body = (
      <>
        <p style={sub}>
          {quick
            ? t('People at your tables see it.', 'Die Leute an deinen Tischen sehen ihn.')
            : t(
                'Optional. Shown at your study tables, and in a Public session when you turn on "Show my name".',
                'Optional. An deinen Lerntischen sichtbar und in einer öffentlichen Session, wenn du „Meinen Namen zeigen" einschaltest.',
              )}
        </p>
        <input
          aria-label={t('Display name', 'Anzeigename')}
          autoComplete="nickname"
          maxLength={32}
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={field}
        />
        {quick
          ? primary(t('Save', 'Speichern'), save, !name.trim())
          : primary(t('Next', 'Weiter'), () => go('visibility'))}
        {!quick && (
          <Button variant="text" onClick={() => { setName(''); go('visibility'); }} style={{ width: '100%' }}>
            {t('Skip', 'Überspringen')}
          </Button>
        )}
      </>
    );
  } else {
    body = (
      <>
        <div role="radiogroup" aria-label={t('Default for new sessions', 'Standard für neue Sessions')}>
          <Radio checked={visibility === 'private'} onSelect={() => setVisibility('private')} trailing={t('default', 'Standard')}>
            <div>{t('Private', 'Privat')}</div>
            <div style={sub}>{t('Others see "Focus session", not who.', 'Andere sehen „Fokus-Session", aber nicht wer.')}</div>
          </Radio>
          {listed && batch && (
            <Radio checked={visibility === 'public'} onSelect={() => setVisibility('public')}>
              <div>{t(`Public · ${batch}`, `Öffentlich · ${batch}`)}</div>
              <div style={sub}>
                {t(`${batch} sees "${batch} student" and can join.`, `${batch} sieht „Studi aus ${batch}" und kann beitreten.`)}
              </div>
            </Radio>
          )}
        </div>
        <p style={sub}>{t('You can change this for each session.', 'Du kannst das bei jeder Session ändern.')}</p>
        {primary(t('Save', 'Speichern'), save)}
      </>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} label={title} variant={cls === 'compact' ? 'sheet' : 'dialog'} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 'var(--label-large-size)', color: 'var(--md-on-surface-variant)' }}>
            {t(`Step ${index} of ${order.length}`, `Schritt ${index} von ${order.length}`)}
          </span>
          <Button variant="text" size="small" onClick={back}>
            {step === 'email' || (signedIn && step === (quick ? 'name' : 'programme')) ? t('Close', 'Schließen') : t('Back', 'Zurück')}
          </Button>
        </div>
        <h2 ref={heading} data-autofocus tabIndex={-1} style={{ margin: 0, fontSize: 'var(--title-large-size)', fontWeight: 400, outline: 'none' }}>
          {title}
        </h2>
        {body}
        {error && (
          <p role="alert" style={{ margin: 0, color: 'var(--md-error)', fontSize: 'var(--body-medium-size)' }}>
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

const sub: CSSProperties = {
  margin: 0,
  fontSize: 'var(--body-medium-size)',
  color: 'var(--md-on-surface-variant)',
};
