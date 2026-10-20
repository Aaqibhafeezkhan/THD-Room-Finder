export type HallKind = 'focus' | 'games' | 'talk' | 'meeting';
export const HALL_KINDS: HallKind[];

export interface HallLayout {
  width: number;
  height: number;
  dot: number;
  /** People per dot (1 up to `maxDots` places, more above). */
  per: number;
  points: [number, number][];
  /** 'g' going or 'm' maybe for the first dots, in reply order. */
  marks: ('g' | 'm')[];
  tables: ({ shape: 'circle'; cx: number; cy: number; r: number } | { shape: 'rect'; x: number; y: number; w: number; h: number })[];
  plate: { cx: number; cy: number; w: number; h: number };
}

export function hallLayout(
  kind: HallKind,
  capacity: number,
  replies: string,
  opts?: { width?: number; maxDots?: number; cols?: number },
): HallLayout;

export function hallSvg(
  layout: HallLayout,
  code: string,
  colors: { table: string; tableEdge: string; text: string; going: string; maybe: string; maybeEdge: string; free: string },
): string;
