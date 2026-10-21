export interface GatheringPreview {
  kind: string;
  title: string;
  org_name: string;
  room_code: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  replies: string;
  cancelled: boolean;
}
export function isGatheringLink(link: string): boolean;
export function gatheringPreview(preview: GatheringPreview | null): { title: string; description: string; card: string | null };
/** The HTML behind /g/<link>; a null preview gives a plain card. */
export function gatheringPage(preview: GatheringPreview | null, link: string, origin: string): string;
