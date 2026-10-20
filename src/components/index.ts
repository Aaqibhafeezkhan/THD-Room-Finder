// Design-system components (ported 1:1 from Claude Design project de229b71).
export { Button } from './core/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './core/Button';
export { Chip } from './core/Chip';
export type { ChipProps } from './core/Chip';
export { Badge } from './core/Badge';
export type { BadgeProps, BadgeTone } from './core/Badge';
export { Card } from './core/Card';
export type { CardProps } from './core/Card';
export { IconButton } from './core/IconButton';
export type { IconButtonProps } from './core/IconButton';
export { LanguageToggle } from './core/LanguageToggle';
export type { LanguageToggleProps, Locale, LocaleOption } from './core/LanguageToggle';
export { SegmentedControl } from './core/SegmentedControl';
export type { SegmentedControlProps, SegmentOption } from './core/SegmentedControl';
export { Switch } from './core/Switch';
export type { SwitchProps } from './core/Switch';
export { Sheet } from './core/Sheet';
export type { SheetProps } from './core/Sheet';
export { ConfirmDialog } from './core/ConfirmDialog';
export type { ConfirmDialogProps } from './core/ConfirmDialog';
export { Snackbar } from './core/Snackbar';
export type { SnackbarProps } from './core/Snackbar';
export { Skeleton } from './core/Skeleton';
export type { SkeletonProps } from './core/Skeleton';

export { Logo } from './app/Logo';
export type { LogoProps } from './app/Logo';
export { AppBar } from './app/AppBar';
export type { AppBarProps } from './app/AppBar';
export { RoomCard } from './app/RoomCard';
export type { RoomCardProps, RoomCardStatus, RoomCardFocus } from './app/RoomCard';
export { StatusCard } from './app/StatusCard';
export type { StatusCardProps } from './app/StatusCard';
export { AdaptiveNav } from './app/AdaptiveNav';
export type { AdaptiveNavProps, NavItem } from './app/AdaptiveNav';

export { CampusMap } from './app/CampusMap/CampusMap';
export { CAMPUS_GEOJSON } from './app/CampusMap/campus-data';
export { CAMPUS_CONTEXT } from './app/CampusMap/context-data';
export type {
  CampusData,
  CampusContext,
  CampusBuildingFeature,
  Availability,
  BuildingGlyph,
  BuildingGlyphs,
  BuildingFocusMark,
  BuildingFocusMarks,
  CampusTheme,
  CampusMapProps,
} from './app/CampusMap/types';

// Focus layer (Phase 1, design sessions D1–D4).
export { ActivityRow } from './focus/ActivityRow';
export type { ActivityRowProps, ActivityKind } from './focus/ActivityRow';
export { FocusButton } from './focus/FocusButton';
export type { FocusButtonProps } from './focus/FocusButton';
export { FocusSurface } from './focus/FocusSurface';
export type { FocusPhase, FocusSurfaceProps, FocusSurfaceText, FocusTrackSegment, FocusVisibility } from './focus/FocusSurface';
export { FocusPill } from './focus/FocusPill';
export type { FocusPillProps } from './focus/FocusPill';
export { FocusSummary } from './focus/FocusSummary';
export type { FocusSummaryProps } from './focus/FocusSummary';
export { CheckInSheet } from './focus/CheckInSheet';
export type { CheckInSheetProps } from './focus/CheckInSheet';
export { FocusBadge } from './focus/FocusBadge';
export type { FocusBadgeProps, FocusBadgeKind } from './focus/FocusBadge';
export { FocusGraph, focusLevel } from './focus/FocusGraph';
export type { FocusGraphProps, FocusGraphText, FocusDay } from './focus/FocusGraph';
export { ShareCard, renderShareCard, semesterWeeks } from './focus/ShareCard';
export type { ShareCardProps, ShareCardOptions, ShareCardFigure, ShareCardFormat } from './focus/ShareCard';
export { ProfileHeader } from './focus/ProfileHeader';
export type { ProfileHeaderProps } from './focus/ProfileHeader';
export { ListNotice } from './focus/ListNotice';
export type { ListNoticeProps } from './focus/ListNotice';
export { MapLegend } from './focus/MapLegend';
export type { MapLegendProps } from './focus/MapLegend';
export { BuildingRow } from './focus/BuildingRow';
export type { BuildingRowProps } from './focus/BuildingRow';

// Study tables (M2, docs/product/study-tables.md).
export { SeatRing } from './tables/SeatRing';
export type { SeatRingProps } from './tables/SeatRing';
export { TableTag } from './tables/TableTag';
export type { TableTagProps, TableTagTone } from './tables/TableTag';
export { StudyTableCard } from './tables/StudyTableCard';
export type { StudyTableCardProps } from './tables/StudyTableCard';
export { SlotChips } from './tables/SlotChips';
export type { SlotChipsProps, SlotDay, SlotOption } from './tables/SlotChips';
export { ReplyBar } from './tables/ReplyBar';
export type { ReplyBarProps, ReplyBarText, ReplyAnswer } from './tables/ReplyBar';
export { TableRow } from './tables/TableRow';
export type { TableRowProps } from './tables/TableRow';
export { TableBanner } from './tables/TableBanner';
export type { TableBannerProps } from './tables/TableBanner';
