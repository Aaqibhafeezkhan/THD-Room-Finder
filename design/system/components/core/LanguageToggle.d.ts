import React from 'react';

export interface Locale {
  /** Locale id passed back through onChange (e.g. 'en', 'de'). */
  id: string;
  /** 2-letter label for the compact pill ('EN', 'DE'). */
  short: string;
  /** Full label for the settings row ('English', 'Deutsch'). */
  label: string;
}

export interface LanguageToggleProps {
  /** Active locale id. */
  value?: string;
  onChange?: (id: string) => void;
  /** 'small' = app-bar pill (shows short labels); 'medium' = settings row. */
  size?: 'small' | 'medium';
  /** Defaults to English + Deutsch; override to add locales. */
  locales?: Locale[];
  style?: React.CSSProperties;
}

/**
 * EN / DE segmented language toggle — the single in-app control that flips
 * locale. The active segment fills with primary (THD blue).
 * @startingPoint section="Core" subtitle="EN / DE segmented language toggle" viewport="700x140"
 */
export function LanguageToggle(props: LanguageToggleProps): JSX.Element;
