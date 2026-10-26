import { useEffect, useState } from 'react';

/**
 * Material 3 window size class — the same breakpoints AdaptiveNav uses, exposed
 * to the app shell so it can place navigation (bottom bar vs rail vs drawer)
 * and switch single-column vs list-detail layouts.
 */
export type WindowClass = 'compact' | 'medium' | 'expanded';

export function classFor(width: number): WindowClass {
  if (width >= 840) return 'expanded';
  if (width >= 600) return 'medium';
  return 'compact';
}

export function useWindowClass(): WindowClass {
  const [cls, setCls] = useState<WindowClass>(() =>
    typeof window !== 'undefined' ? classFor(window.innerWidth) : 'compact',
  );
  useEffect(() => {
    const on = () => setCls(classFor(window.innerWidth));
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return cls;
}

/**
 * Whether to use the wide, side-by-side (map + panel, rail/drawer) layout.
 * True only when the viewport is both wide enough *and* landscape — a tablet
 * held upright (portrait) is tall and narrow, so it gets the mobile stacked
 * layout even though its width alone would qualify as medium/expanded.
 */
export function isWideLayout(width: number, height: number): boolean {
  return width >= 600 && width > height;
}

export function useWideLayout(): boolean {
  const [wide, setWide] = useState<boolean>(() =>
    typeof window !== 'undefined' ? isWideLayout(window.innerWidth, window.innerHeight) : false,
  );
  useEffect(() => {
    const on = () => setWide(isWideLayout(window.innerWidth, window.innerHeight));
    on();
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return wide;
}

export type NavigationVariant = 'bar' | 'rail' | 'drawer';

/** Short landscape phones need a rail, not a desktop drawer taking a third of the screen. */
export function navigationVariantFor(width: number, height: number): NavigationVariant {
  if (!isWideLayout(width, height)) return 'bar';
  return width >= 840 && height >= 600 ? 'drawer' : 'rail';
}

export function useNavigationVariant(): NavigationVariant {
  const [variant, setVariant] = useState<NavigationVariant>(() => typeof window === 'undefined' ? 'bar' : navigationVariantFor(window.innerWidth, window.innerHeight));
  useEffect(() => {
    const on = () => setVariant(navigationVariantFor(window.innerWidth, window.innerHeight));
    on();
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); };
  }, []);
  return variant;
}

/**
 * How the Focus tab lays itself out (#190): `stack` on phones held upright,
 * `split` on short landscape screens (the timer beside its controls, so End
 * stays on screen), `stage` on tablets and desktops (centred, larger timer,
 * the two places side by side), whatever the width.
 */
export type FocusLayout = 'stack' | 'split' | 'stage';

export function focusLayoutFor(width: number, height: number): FocusLayout {
  if (width > height && height < 560) return width >= 560 ? 'split' : 'stack';
  if (width >= 600 && height >= 560) return 'stage';
  return 'stack';
}

export function useFocusLayout(): FocusLayout {
  const [layout, setLayout] = useState<FocusLayout>(() =>
    typeof window === 'undefined' ? 'stack' : focusLayoutFor(window.innerWidth, window.innerHeight),
  );
  useEffect(() => {
    const on = () => setLayout(focusLayoutFor(window.innerWidth, window.innerHeight));
    on();
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return layout;
}
