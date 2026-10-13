import React from 'react';

/** A GeoJSON-ish building feature. properties carry the room-finder fields. */
export interface CampusBuildingFeature {
  type: 'Feature';
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: any };
  properties: {
    /** stable id used for selection + availability lookup (e.g. "C", "ITC2"). */
    key: string;
    /** short on-roof label (e.g. "C", "ITC²"). */
    label: string;
    /** full human name shown by the host UI. */
    name: string;
    /** building height in metres (drives the extrusion). */
    height?: number;
    /** true = off the riverside core (selecting it reframes the map). */
    sat?: boolean;
    /** building centroid — used for label/placement + framing. */
    lon: number; lat: number;
    /** fallback availability if the `availability` prop omits this key. */
    free?: number; total?: number;
  };
}

export interface CampusData {
  type: 'FeatureCollection';
  features: CampusBuildingFeature[];
}

/** Surroundings, as raw [lon,lat] geometry (all optional). */
export interface CampusContext {
  roads?: { g: [number, number][]; n?: string; big?: 0 | 1 }[];
  paths?: { g: [number, number][] }[] | [number, number][][];
  water?: [number, number][][];
  river?: [number, number][][];
  green?: [number, number][][];
  trees?: [number, number][];
}

/** Per-building live availability (overrides feature props). */
export type Availability = Record<string, { free: number; total: number }>;

/** Deep-overridable colour theme. Omitted keys fall back to the default. */
export interface CampusTheme {
  ramp?: string[];
  rampStops?: number[];
  status?: { full?: string; some?: string; free?: string; busy?: string };
  selOutline?: { dark?: string; light?: string };
  donau?: string;
  light?: Record<string, any>;
  dark?: Record<string, any>;
}

export interface CampusMapProps {
  /** Buildings to extrude + make selectable. */
  campus: CampusData;
  /** Optional surroundings (streets, Donau, parks, trees). */
  context?: CampusContext;
  /** Live free/total per building key; falls back to feature props. */
  availability?: Availability;
  /** 'auto' follows the OS setting; 'light' / 'dark' force it. */
  mode?: 'auto' | 'light' | 'dark';
  /** Override any palette colour — the single theming surface. */
  theme?: CampusTheme;
  /** Initial camera, in degrees. */
  bearing?: number;
  tilt?: number;
  /** Controlled selection. Omit to let the map manage its own. */
  selectedKey?: string;
  /** Fires with the building key when one is tapped. */
  onSelect?: (key: string) => void;
  /** Enable drag-pan / wheel-zoom / tap-select (default true). */
  interactive?: boolean;
  showLabels?: boolean;
  showTrees?: boolean;
  style?: React.CSSProperties;
}

/**
 * A self-contained 2.5D campus map: real OpenStreetMap footprints extruded
 * and tinted by room availability, with streets, water, parks and trees.
 * No tiles, no WebGL, no API key — pure SVG. Tap a building to select it.
 * @dsComponent section="Room Finder" subtitle="2.5D campus map with availability" viewport="900x560"
 */
export function CampusMap(props: CampusMapProps): JSX.Element;
