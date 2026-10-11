import { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Motion vocabulary for illueur.
 *
 * The metaphor is the printer: things arrive layer by layer, from the bottom
 * up, in visible steps. `printEase` quantises any tween into discrete layers,
 * and is used wherever something "prints" in rather than fades in.
 */

export const EASE = [0.22, 1, 0.36, 1];
export const EASE_IN_OUT = [0.76, 0, 0.24, 1];

/** Quantise a tween into n visible steps, like layers on a print. */
export const printEase = (n = 18) => (t) => Math.min(1, Math.ceil(t * n) / n);

export const rise = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

export const stagger = (s = 0.06, delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: s, delayChildren: delay } },
});

/** Clip from the bottom up in layer steps. */
export const printIn = (n = 20, duration = 1.1) => ({
  hidden: { clipPath: 'inset(100% 0% 0% 0%)' },
  visible: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration, ease: printEase(n) } },
});

export const viewOnce = { once: true, margin: '-12% 0px' };

// ── Smooth scroll ───────────────────────────────────────────────────────────

let lenis = null;

/** Scroll to an element id or a y offset, through Lenis when it is running. */
export function scrollToTarget(target, { immediate = false } = {}) {
  const el = typeof target === 'string' ? document.getElementById(target.replace('#', '')) : null;
  if (lenis) {
    lenis.scrollTo(el || target, { offset: -70, immediate, duration: 1.4 });
    return;
  }
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' });
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
  }
}

/** Lenis on fine pointers only, never under reduced motion. */
export function useSmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || window.matchMedia('(pointer: coarse)').matches) return undefined;
    let frame;
    let cancelled = false;

    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)) });
      const raf = (time) => {
        lenis.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      lenis?.destroy();
      lenis = null;
    };
  }, [reduced]);
}

/** Pause/resume Lenis, for modal drawers. */
export function lockScroll(locked) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

export { useReducedMotion };
