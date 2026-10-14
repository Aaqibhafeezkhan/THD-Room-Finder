// Mirror of src/components/core/Sheet.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React, { useEffect, useRef } from 'react';

/**
 * Modal surface (D1 check-in, D2 setup and delete, D4 share): a bottom sheet on
 * compact windows, a centred dialog on medium and expanded ones. Scrim at 32 %
 * black, Escape and the scrim close it, Tab stays inside, and focus moves to
 * the first element marked `data-autofocus` (else the surface itself) and back
 * to whatever was focused before when it closes. No slide under reduced motion.
 */
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
export function Sheet({ open, onClose, label, variant = 'sheet', role = 'dialog', width = 440, contained = false, children, style = {}, }) {
    const surface = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const before = document.activeElement;
        const el = surface.current;
        const first = el?.querySelector('[data-autofocus]');
        (first ?? el)?.focus();
        return () => before?.focus?.();
    }, [open]);
    if (!open)
        return null;
    const onKey = (e) => {
        if (e.key === 'Escape' && onClose) {
            e.stopPropagation();
            onClose();
            return;
        }
        if (e.key !== 'Tab' || !surface.current)
            return;
        const items = Array.from(surface.current.querySelectorAll(FOCUSABLE));
        if (!items.length)
            return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
        else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };
    const sheet = variant === 'sheet';
    return (<div onClick={(e) => e.target === e.currentTarget && onClose && onClose()} style={{
            position: contained ? 'absolute' : 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0, 0, 0, 0.32)',
            display: 'flex',
            alignItems: sheet ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: sheet ? 0 : 24,
        }}>
      <div ref={surface} role={role} aria-modal="true" aria-label={label} tabIndex={-1} onKeyDown={onKey} className="thd-sheet" style={{
            width: sheet ? '100%' : `min(${width}px, 100%)`,
            maxHeight: sheet ? '90%' : 'calc(100% - 48px)',
            overflowY: 'auto',
            background: 'var(--md-surface)',
            color: 'var(--md-on-surface)',
            borderRadius: sheet ? 'var(--radius-xl) var(--radius-xl) 0 0' : 'var(--radius-xl)',
            boxShadow: 'var(--md-shadow-2)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            ...style,
        }}>
        {children}
      </div>
    </div>);
}
