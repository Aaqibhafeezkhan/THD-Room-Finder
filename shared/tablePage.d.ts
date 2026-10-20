export interface TablePreview {
  topic: string | null;
  room_code: string | null;
  starts_at: string;
  ends_at: string;
  seats: number;
  taken: number;
  cancelled: boolean;
}
export function isTableLink(link: string): boolean;
export function tablePreview(preview: TablePreview | null): { title: string; description: string; card: string | null };
/** The HTML behind /t/<link>; a null preview gives a plain card. */
export function tablePage(preview: TablePreview | null, link: string, origin: string): string;
