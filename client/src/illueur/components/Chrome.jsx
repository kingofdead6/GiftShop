import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { EASE, EASE_IN_OUT, printEase, useReducedMotion } from '../lib/motion';

/**
 * Small pieces of site chrome that carry most of the motion: the custom
 * cursor, the first-visit "print" preloader, the scroll-velocity marquee and
 * magnetic buttons.
 */

// ── Cursor ──────────────────────────────────────────────────────────────────

/**
 * A dot that follows the pointer exactly and a ring that trails it. Any
 * element with `data-cursor="Label"` grows the ring into a label bubble;
 * `data-cursor=""` just grows it. Fine pointers only.
 */
export function Cursor() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState(null);
  const [down, setDown] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 420, damping: 36, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 420, damping: 36, mass: 0.6 });

  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return undefined;
    setEnabled(true);
    document.documentElement.classList.add('has-cursor');
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target.closest?.('[data-cursor], a, button');
      if (!el) setLabel(null);
      else setLabel(el.dataset.cursor ?? '');
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', dn);
    window.addEventListener('pointerup', up);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', dn);
      window.removeEventListener('pointerup', up);
    };
  }, [reduced, x, y]);

  if (!enabled) return null;
  const big = label !== null;
  const text = label && label.length ? label : null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]">
      <motion.div
        style={{ x: rx, y: ry }}
        className="absolute left-0 top-0"
      >
        <motion.div
          animate={{
            width: text ? 88 : big ? 54 : 34,
            height: text ? 88 : big ? 54 : 34,
            backgroundColor: text ? 'rgba(255,79,26,1)' : 'rgba(255,79,26,0)',
            borderColor: text ? 'rgba(255,79,26,0)' : 'rgba(255,79,26,0.9)',
            scale: down ? 0.85 : 1,
          }}
          transition={{ duration: 0.35, ease: EASE }}
          className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border"
        >
          <AnimatePresence>
            {text ? (
              <motion.span
                key={text}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mono text-[10px] text-ink"
              >
                {text}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      <motion.div style={{ x, y }} className="absolute left-0 top-0">
        <div className="h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember" />
      </motion.div>
    </div>
  );
}

// ── Preloader ───────────────────────────────────────────────────────────────

/**
 * First visit of the session: a build plate fills layer by layer while a
 * readout counts the layers, then the plate lifts away like a finished print.
 */
export function Preloader() {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('illueur.loaded');
    } catch {
      return true;
    }
  });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!show) return undefined;
    if (reduced) {
      setShow(false);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const D = 1700;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / D);
      setN(Math.round((1 - (1 - k) ** 2.2) * 100));
      if (k < 1) raf = requestAnimationFrame(tick);
      else
        setTimeout(() => {
          try {
            sessionStorage.setItem('illueur.loaded', '1');
          } catch {
            /* ignore */
          }
          setShow(false);
        }, 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show, reduced]);

  const layers = 24;
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="pre"
          exit={{ y: '-100%' }}
          transition={{ duration: 0.9, ease: EASE_IN_OUT }}
          className="fixed inset-0 z-[95] flex flex-col justify-between bg-ink p-5 text-bone sm:p-8"
        >
          <div className="flex justify-between">
            <span className="mono text-smoke">Atelier illueur</span>
            <span className="mono text-smoke">PLA · 0.2 mm · 220°C</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex w-[min(320px,70vw)] flex-col-reverse gap-[3px]">
              {Array.from({ length: layers }, (_, i) => {
                const on = n / 100 >= (i + 1) / layers;
                // Slight vase profile so the bars read as an object, not a progress bar.
                const t = i / (layers - 1);
                const w = 46 + 34 * Math.sin(Math.PI * (0.1 + 0.8 * t)) ** 0.8;
                return (
                  <div
                    key={i}
                    className="mx-auto h-[6px] rounded-full transition-colors duration-150"
                    style={{ width: `${w}%`, background: on ? (i === Math.floor((n / 100) * layers) - 1 ? '#ff4f1a' : '#efebe3') : 'rgba(239,235,227,0.08)' }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-end justify-between">
            <span className="display text-[22vw] leading-[0.8] tracking-[-0.06em] sm:text-[160px]">
              {String(n).padStart(3, '0')}
            </span>
            <span className="mono pb-3 text-smoke">
              Layer {String(Math.round((n / 100) * layers)).padStart(2, '0')}/{layers}
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ── Velocity marquee ────────────────────────────────────────────────────────

const wrap = (min, max, v) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

/** An endless strip that speeds up and reverses with the scroll. */
export function VelocityMarquee({ children, base = -2.2, className = '' }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const vel = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(vel, [-1000, 0, 1000], [-4, 0, 4], { clamp: false });
  const dir = useRef(1);
  const pct = useTransform(x, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduced) return;
    let move = dir.current * base * (delta / 1000);
    if (factor.get() < 0) dir.current = -1;
    else if (factor.get() > 0) dir.current = 1;
    move += dir.current * move * factor.get();
    x.set(x.get() + move);
  });

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div style={{ x: pct }} className="flex w-max">
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// ── Magnetic ────────────────────────────────────────────────────────────────

/** Pulls its child toward the pointer while hovered. */
export function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 250, damping: 18 });
  const y = useSpring(0, { stiffness: 250, damping: 18 });

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className={`inline-block ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Print-in text ───────────────────────────────────────────────────────────

/**
 * Text that prints in: each line is clipped from the bottom up in visible
 * steps, the way a layer stack grows on the plate.
 */
export function PrintText({ children, className = '', delay = 0, steps = 14, as: Tag = 'span', animateNow = false }) {
  const reduced = useReducedMotion();
  const MotionTag = motion[Tag] || motion.span;
  if (reduced) return <Tag className={className}>{children}</Tag>;
  const variants = {
    hidden: { clipPath: 'inset(100% -2% -10% -2%)', y: '0.12em' },
    visible: {
      clipPath: 'inset(-10% -2% -10% -2%)',
      y: 0,
      transition: { duration: 0.9, delay, ease: printEase(steps) },
    },
  };
  return (
    <MotionTag
      className={`inline-block ${className}`}
      initial="hidden"
      {...(animateNow ? { animate: 'visible' } : { whileInView: 'visible', viewport: { once: true, margin: '-8% 0px' } })}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}

/** Lines that rise out of a mask, one after another. */
export function RiseLines({ lines, className = '', lineClass = '', delay = 0, animateNow = false }) {
  const reduced = useReducedMotion();
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className={`block ${lineClass}`}
            initial={reduced ? false : { y: '105%' }}
            {...(animateNow ? { animate: { y: 0 } } : { whileInView: { y: 0 }, viewport: { once: true } })}
            transition={{ duration: 1.05, delay: delay + i * 0.09, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
