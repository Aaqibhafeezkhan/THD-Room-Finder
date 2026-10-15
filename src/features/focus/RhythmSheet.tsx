import { useEffect, useState } from 'react';
import { Button, IconButton, Sheet } from '../../components';
import { CUSTOM_BREAK, CUSTOM_FOCUS, DEFAULT_RHYTHM_ID, RHYTHMS, customRhythm, rhythmId } from '../../domain/focusRhythm';
import type { Rhythm } from '../../domain/focusRhythm';
import { useI18n } from '../../i18n';
import { useWindowClass } from '../../lib/useWindowClass';
import { Radio } from '../shared/Radio';
import { PRESET_ORDER, rhythmLine, rhythmName } from './sessionView';

/**
 * Pick a focus rhythm (ADR 0004): Deep, Pomodoro, Lecture, Open or Custom
 * with focus and break lengths in steps of 5 minutes. Used from Settings
 * (the default) and under Start focus (this session only).
 */
export interface RhythmSheetProps {
  open: boolean;
  title: string;
  value: Rhythm;
  onClose: () => void;
  onPick: (r: Rhythm) => void;
}

function Stepper({ label, value, min, max, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 4px 32px' }}>
      <span style={{ flex: 1, fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>{label}</span>
      <IconButton label={t(`Shorter ${label}`, `${label} kürzer`)} disabled={value <= min} onClick={() => onChange(value - 5)}>
        <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>−</span>
      </IconButton>
      <output
        aria-live="polite"
        style={{ minWidth: 64, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--body-large-size)' }}
      >
        {t(`${value} min`, `${value} Min.`)}
      </output>
      <IconButton label={t(`Longer ${label}`, `${label} länger`)} disabled={value >= max} onClick={() => onChange(value + 5)}>
        <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>+</span>
      </IconButton>
    </div>
  );
}

export function RhythmSheet({ open, title, value, onClose, onPick }: RhythmSheetProps) {
  const { t } = useI18n();
  const cls = useWindowClass();
  const [choice, setChoice] = useState<Rhythm>(value);
  const [custom, setCustom] = useState<Rhythm>(() => (rhythmId(value) === 'custom' ? value : customRhythm(40, 10)));

  useEffect(() => {
    if (!open) return;
    setChoice(value);
    if (rhythmId(value) === 'custom') setCustom(value);
  }, [open, value]);

  const isCustom = rhythmId(choice) === 'custom';

  return (
    <Sheet open={open} onClose={onClose} label={title} variant={cls === 'compact' ? 'sheet' : 'dialog'} width={440}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>{title}</h2>
      <div role="radiogroup" aria-label={title}>
        {PRESET_ORDER.map((id) => (
          <Radio
            key={id}
            checked={rhythmId(choice) === id}
            onSelect={() => setChoice(RHYTHMS[id])}
            trailing={id === DEFAULT_RHYTHM_ID ? t('default', 'Standard') : undefined}
          >
            <div>{rhythmName(RHYTHMS[id], t)}</div>
            <div style={{ fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>
              {rhythmLine(RHYTHMS[id], t)}
            </div>
          </Radio>
        ))}
        <Radio checked={isCustom} onSelect={() => setChoice(custom)}>
          <div>{t('Custom', 'Eigener')}</div>
          <div style={{ fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>{rhythmLine(custom, t)}</div>
        </Radio>
      </div>
      {isCustom && (
        <div>
          <Stepper
            label={t('Focus', 'Fokus')}
            value={custom.focus}
            min={CUSTOM_FOCUS.min}
            max={CUSTOM_FOCUS.max}
            onChange={(v) => {
              const r = customRhythm(v, custom.break);
              setCustom(r);
              setChoice(r);
            }}
          />
          <Stepper
            label={t('Break', 'Pause')}
            value={custom.break}
            min={CUSTOM_BREAK.min}
            max={CUSTOM_BREAK.max}
            onChange={(v) => {
              const r = customRhythm(custom.focus, v);
              setCustom(r);
              setChoice(r);
            }}
          />
        </div>
      )}
      <p style={{ margin: 0, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)', textWrap: 'pretty' }}>
        {t(
          'Only focus time counts for your graph. After each break, tap to start the next block; with no answer the session ends at the last block.',
          'Nur Fokuszeit zählt für deinen Verlauf. Nach jeder Pause tippst du, um den nächsten Block zu starten; ohne Antwort endet die Session mit dem letzten Block.',
        )}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="text" onClick={onClose}>
          {t('Cancel', 'Abbrechen')}
        </Button>
        <Button
          variant="filled"
          onClick={() => {
            onPick(choice);
            onClose();
          }}
        >
          {t('Done', 'Fertig')}
        </Button>
      </div>
    </Sheet>
  );
}
