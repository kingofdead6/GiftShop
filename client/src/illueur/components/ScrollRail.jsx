import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { scrollToY } from '../lib/motion';

/**
 * The scrollbar, as a print in progress.
 *
 * Replaces the native page scrollbar on fine pointers: a rail of layer lines
 * that fill in as the page is read, a draggable ember "nozzle" for the thumb,
 * a percentage readout while scrolling, and, on pages that have them, a
 * marker per section that jumps there on click.
 *
 * Touch devices keep their native overlay scrollbar, which is already
 * unobtrusive and which people expect to flick.
 */

const SECTIONS = [
  ['drop', 'Encens'],
  ['collections', 'Collections'],
  ['pieces', 'Pièces'],
  ['atelier', 'Atelier'],
  ['livraison', 'Livraison'],
];

const TOP = 92; // clears the floating navbar
const BOTTOM = 16;

export default function ScrollRail() {
  const [enabled, setEnabled] = useState(false);
  const [thumb, setThumb] = useState(0.2);
  const [markers, setMarkers] = useState([]);
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState(null);
  const [pct, setPct] = useState(0);
  const railRef = useRef(null);
  const drag = useRef(null);
  const idle = useRef(0);
  const { pathname } = useLocation();

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 400, damping: 50, mass: 0.3 });
  const fill = useTransform(progress, (v) => `${v * 100}%`);
  const thumbTop = useTransform(progress, (v) => `${v * (1 - thumb) * 100}%`);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)');
    const apply = () => setEnabled(fine.matches);
    apply();
    fine.addEventListener('change', apply);
    return () => fine.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('has-rail', enabled);
    return () => document.documentElement.classList.remove('has-rail');
  }, [enabled]);

  // Thumb size and section markers depend on page height, which changes as
  // images, routes and the pinned collections section settle.
  useEffect(() => {
    if (!enabled) return undefined;
    const measure = () => {
      const doc = document.documentElement.scrollHeight;
      const view = window.innerHeight;
      setThumb(Math.min(1, Math.max(0.06, view / doc)));
      const max = Math.max(1, doc - view);
      setMarkers(
        SECTIONS.map(([id, label]) => {
          const el = document.getElementById(id);
          if (!el) return null;
          const y = el.getBoundingClientRect().top + window.scrollY - 70;
          return { id, label, y: Math.max(0, y), at: Math.min(1, Math.max(0, y / max)) };
        }).filter(Boolean)
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 900);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      clearTimeout(t);
    };
  }, [enabled, pathname]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setPct(Math.round(v * 100));
    setActive(true);
    clearTimeout(idle.current);
    idle.current = setTimeout(() => !drag.current && setActive(false), 900);
  });

  if (!enabled || thumb >= 1) return null;

  const yFromPointer = (clientY, grabOffset = thumb / 2) => {
    const r = railRef.current.getBoundingClientRect();
    const ratio = (clientY - r.top) / r.height - grabOffset;
    const k = Math.min(1, Math.max(0, ratio / (1 - thumb)));
    return k * (document.documentElement.scrollHeight - window.innerHeight);
  };

  const onDown = (e) => {
    const r = railRef.current.getBoundingClientRect();
    const thumbStart = scrollYProgress.get() * (1 - thumb);
    const at = (e.clientY - r.top) / r.height;
    const onThumb = at >= thumbStart && at <= thumbStart + thumb;
    if (!onThumb) {
      scrollToY(yFromPointer(e.clientY));
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { offset: at - thumbStart };
    setActive(true);
  };
  const onMove = (e) => {
    if (!drag.current) return;
    scrollToY(yFromPointer(e.clientY, drag.current.offset), { immediate: true });
  };
  const onUp = () => {
    drag.current = null;
  };

  const show = active || hover !== null;

  return (
    <div
      aria-hidden="true"
      className="fixed right-0 z-[70] flex w-7 justify-center"
      style={{ top: TOP, bottom: BOTTOM }}
      onPointerEnter={() => setHover('rail')}
      onPointerLeave={() => setHover(null)}
    >
      <div
        ref={railRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="group relative h-full w-full cursor-pointer select-none"
        data-cursor=""
      >
        {/* Unprinted layers: faint ticks. Mid-grey reads on both the bone
            and the ink sections. */}
        <motion.div
          animate={{ width: show ? 10 : 6, opacity: show ? 0.9 : 0.55 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-y-0 left-1/2 -translate-x-1/2"
          style={{ backgroundImage: 'repeating-linear-gradient(to bottom, #8f897f 0 1px, transparent 1px 5px)' }}
        />

        {/* Printed layers: solid ticks up to the current position. */}
        <motion.div
          className="absolute left-1/2 top-0 -translate-x-1/2 overflow-hidden"
          style={{ height: fill }}
          animate={{ width: show ? 10 : 6 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="h-[calc(100vh-108px)] w-full"
            style={{ backgroundImage: 'repeating-linear-gradient(to bottom, #ff4f1a 0 2px, transparent 2px 5px)' }}
          />
        </motion.div>

        {/* Section markers */}
        {markers.map((m) => (
          <button
            key={m.id}
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => scrollToY(m.y)}
            onPointerEnter={() => setHover(m.id)}
            onPointerLeave={() => setHover('rail')}
            className="absolute left-1/2 z-10 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ top: `${m.at * 100}%` }}
          >
            <span
              className={`block h-[3px] rounded-full transition-all duration-300 ${pct / 100 >= m.at - 0.001 ? 'bg-ember' : 'bg-ash'} ${
                hover === m.id ? 'w-4' : 'w-2.5'
              }`}
            />
            <AnimatePresence>
              {hover === m.id ? (
                <motion.span
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                  className="mono pointer-events-none absolute right-6 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[10px] text-bone"
                >
                  {m.label}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </button>
        ))}

        {/* The nozzle: the draggable thumb. */}
        <motion.div className="absolute left-1/2 -translate-x-1/2" style={{ top: thumbTop, height: `${thumb * 100}%` }}>
          <motion.div
            animate={{ width: show ? 12 : 6 }}
            transition={{ duration: 0.3 }}
            className="relative mx-auto h-full rounded-full bg-ink shadow-[0_0_0_1.5px_rgba(239,235,227,0.8)]"
          >
            {/* Hot tip at the bottom edge of the thumb. */}
            <span className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-ember shadow-[0_0_10px_3px_rgba(255,79,26,0.65)]" />
            <AnimatePresence>
              {show ? (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25 }}
                  className="pointer-events-none absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-bone"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-ember" />
                  {String(pct).padStart(3, '0')}%
                </motion.span>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
