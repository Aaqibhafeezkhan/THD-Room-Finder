import { useEffect, useState } from 'react';
import { Button, Sheet } from '../../components';
import { IconPlay } from '../../components/focus/focusIcons';
import { soundPlayer } from '../../data/focusSounds';
import { useI18n } from '../../i18n';
import { useWindowClass } from '../../lib/useWindowClass';
import { Radio } from '../shared/Radio';
import { DEFAULT_SOUNDS, SOUND_ORDER, isPlayable, soundLine, soundName } from './soundPreference';
import type { SoundPlace, SoundSet } from './soundPreference';

/**
 * Pick the sounds for a place (ADR 0012): Coffee break, Jingle, Chimes, the
 * phone's own sound or Silent. Each set has a play button that plays its
 * break sound and then its break's-over sound, so the pair is heard
 * together. Used from Settings → Focus and the Focus tab.
 */
export interface SoundSheetProps {
  open: boolean;
  place: SoundPlace;
  value: SoundSet;
  onClose: () => void;
  onPick: (set: SoundSet) => void;
}

export function SoundSheet({ open, place, value, onClose, onPick }: SoundSheetProps) {
  const { t } = useI18n();
  const cls = useWindowClass();
  const [choice, setChoice] = useState<SoundSet>(value);
  useEffect(() => {
    if (open) setChoice(value);
  }, [open, value]);
  const title = place === 'home' ? t('Sounds at home', 'Töne zu Hause') : t('Sounds on campus', 'Töne auf dem Campus');

  return (
    <Sheet open={open} onClose={onClose} label={title} variant={cls === 'compact' ? 'sheet' : 'dialog'} width={440}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>{title}</h2>
      <div role="radiogroup" aria-label={title}>
        {SOUND_ORDER.map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Radio checked={choice === s} onSelect={() => setChoice(s)}>
                <div>
                  {soundName(s, t)}
                  {DEFAULT_SOUNDS[place] === s && (
                    <span style={{ color: 'var(--md-on-surface-variant)', fontSize: 'var(--body-medium-size)' }}> · {t('default', 'Standard')}</span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>{soundLine(s, t)}</div>
              </Radio>
            </div>
            {isPlayable(s) && (
              <button
                type="button"
                className="thd-icon-button"
                aria-label={t(`Play ${soundName(s, t)}`, `${soundName(s, t)} abspielen`)}
                onClick={() => {
                  setChoice(s);
                  void soundPlayer().preview(s);
                }}
                style={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--md-secondary-container)',
                  color: 'var(--md-on-secondary-container)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <IconPlay size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)', textWrap: 'pretty' }}>
        {t(
          "A sound when a break starts, another when it's over (once more 5 minutes later if you haven't started), and one when you're done. The speaker on the session turns them off for that session.",
          'Ein Ton, wenn eine Pause beginnt, ein anderer, wenn sie vorbei ist (5 Minuten später noch einmal, falls du nicht weitergemacht hast), und einer, wenn du fertig bist. Mit dem Lautsprecher in der Session schaltest du sie für diese Session aus.',
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
