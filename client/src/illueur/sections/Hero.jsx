import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { brand, instagramDmUrl } from '../config';
import { SHAPES, drawPrint, fitCanvas } from '../lib/layerRender';
import { EASE, printEase, scrollToTarget, useReducedMotion } from '../lib/motion';
import { Magnetic, RiseLines } from '../components/Chrome';

const QUEUE = [
  { shape: 'kraft', color: '#C49A6C' },
  { shape: 'citron', color: '#F2C230' },
  { shape: 'vague', color: '#F4E7D3' },
  { shape: 'sculpte', color: '#3E8A62' },
  { shape: 'flamme', color: '#F08A3C' },
];

const PRINT = 5.2;
const SHOW = 2.4;
const EJECT = 0.7;

/**
 * The hero printer. Prints a piece layer by layer with the nozzle visible,
 * shows it off spinning, lifts it off the plate and starts the next one.
 * The HUD is written straight to the DOM so the loop never re-renders React.
 */
function HeroPrinter() {
  const canvasRef = useRef(null);
  const hud = useRef({});
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    let raf;
    let start = performance.now();
    let idx = 0;
    let pointer = 0;
    let rotOffset = 0;
    let visible = true;

    const onMove = (e) => {
      pointer = (e.clientX / window.innerWidth - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);

    const setText = (k, v) => {
      if (hud.current[k] && hud.current[k].textContent !== v) hud.current[k].textContent = v;
    };

    function tick(now) {
      raf = 0;
      if (!visible) return;
      const { ctx, w, h } = fitCanvas(canvas);
      const item = QUEUE[idx];
      const shape = SHAPES[item.shape];
      let t = (now - start) / 1000;

      if (reduced) t = PRINT + 0.5;

      let progress = Math.min(1, t / PRINT);
      // Ease the print: fast first layers, slower near the top, like a real
      // print where small upper layers wait on cooling.
      progress = 1 - (1 - progress) ** 1.25;
      const spin = Math.max(0, t - PRINT) * 0.9;
      rotOffset += (pointer * 0.8 - rotOffset) * 0.05;

      let lift = 0;
      if (t > PRINT + SHOW) lift = Math.min(1, (t - PRINT - SHOW) / EJECT);

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.globalAlpha = 1 - lift;
      ctx.translate(0, -lift * h * 0.12);
      const info = drawPrint(ctx, w, h, {
        shape: item.shape,
        color: item.color,
        progress,
        rotation: 0.4 + spin + rotOffset,
        nozzle: progress < 1,
        rail: progress < 1,
        tilt: 0.3,
        padding: 0.1,
      });
      ctx.restore();

      setText('name', shape.nom);
      setText('layer', `${String(info.layer).padStart(3, '0')}/${info.total}`);
      setText('temp', progress < 1 ? `${218 + Math.round(Math.sin(now / 300) * 2)}°C` : '— idle');
      setText('pct', `${Math.round(progress * 100)}%`);
      setText('status', progress < 1 ? 'Impression' : lift > 0 ? 'Éjection' : 'Terminé ✓');
      if (hud.current.bar) hud.current.bar.style.transform = `scaleX(${progress})`;

      if (!reduced && t > PRINT + SHOW + EJECT) {
        idx = (idx + 1) % QUEUE.length;
        start = now;
      }
      // Reduced motion: one finished frame, no loop.
      if (!reduced) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced]);

  const set = (k) => (el) => {
    hud.current[k] = el;
  };

  return (
    <div className="relative h-full w-full">
      {/* Build plate grid */}
      <div
        aria-hidden="true"
        className="absolute inset-x-[6%] bottom-[8%] h-[34%] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(239,235,227,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(239,235,227,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          transform: 'perspective(500px) rotateX(62deg)',
          transformOrigin: 'bottom',
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      <div className="absolute left-3 top-3 rounded-2xl border border-bone/10 bg-ink/50 p-4 backdrop-blur-md sm:left-6 sm:top-6">
        <p className="mono text-[10px] text-smoke">En cours</p>
        <p ref={set('name')} className="mt-1 text-[15px] font-semibold text-bone" />
        <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1">
          <dt className="mono text-[10px] text-smoke">Layer</dt>
          <dd ref={set('layer')} className="mono text-[10px] text-bone" />
          <dt className="mono text-[10px] text-smoke">Buse</dt>
          <dd ref={set('temp')} className="mono text-[10px] text-ember" />
          <dt className="mono text-[10px] text-smoke">Matière</dt>
          <dd className="mono text-[10px] text-bone">PLA · 0.2mm</dd>
        </dl>
      </div>

      <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-bone/10 bg-ink/50 px-4 py-3 backdrop-blur-md sm:inset-x-6 sm:bottom-6">
        <div className="flex items-center justify-between">
          <span ref={set('status')} className="mono text-[10px] text-bone" />
          <span ref={set('pct')} className="mono text-[10px] text-smoke" />
        </div>
        <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-bone/10">
          <div ref={set('bar')} className="h-full origin-left rounded-full bg-ember" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  );
}

export default function Hero({ introDelay = 0 }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const d = introDelay;

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-ink text-bone">
      <div aria-hidden="true" className="layer-lines-light absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute -right-[20%] top-[10%] -z-10 h-[70vmax] w-[70vmax] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(255,79,26,0.45), transparent 60%)' }}
      />

      <motion.div
        style={reduced ? undefined : { y, scale }}
        className="mx-auto grid min-h-[100svh] max-w-[1500px] grid-rows-[auto_1fr] gap-6 px-5 pb-8 pt-28 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:grid-rows-1 lg:gap-10 lg:pt-24"
      >
        <div className="flex flex-col justify-center lg:pb-16">
          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: d, duration: 0.6, ease: printEase(5) }}
            className="mono flex items-center gap-2 text-smoke"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-ember ember" />
            {brand.tagline}
          </motion.p>

          <h1 className="display mt-6 text-[clamp(52px,7.4vw,124px)]">
            <RiseLines
              animateNow
              delay={d + 0.1}
              lines={[
                <span key="o">
                  Objets{' '}
                  <span className="serif-i font-normal text-ember">imprimés</span>
                </span>,
                'couche par',
                'couche.',
              ]}
            />
          </h1>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: d + 0.7, duration: 0.9, ease: EASE }}
            className="mt-8 flex max-w-md flex-col gap-7"
          >
            <p className="text-[17px] leading-relaxed text-bone/75">
              Vases, lampes, porte-encens et pièces statement. Dessinés et imprimés en 3D dans notre atelier, livrés
              partout en Algérie.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Magnetic>
                <a
                  href="#pieces"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToTarget('pieces');
                  }}
                  data-cursor="Go"
                  className="group relative inline-flex h-14 items-center overflow-hidden rounded-full bg-bone px-7 font-semibold text-ink"
                >
                  <span className="absolute inset-0 origin-bottom scale-y-0 bg-ember transition-transform duration-500 ease-out-expo group-hover:scale-y-100" />
                  <span className="relative">Voir les pièces</span>
                </a>
              </Magnetic>
              <a
                href={instagramDmUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-14 items-center gap-2 rounded-full border border-bone/20 px-6 font-medium transition-colors hover:border-ember hover:text-ember"
              >
                Commander en DM ↗
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: d + 0.2, duration: 1.2, ease: EASE }}
          className="relative h-[62svh] min-h-[420px] overflow-hidden rounded-[28px] border border-bone/10 bg-char lg:my-6 lg:h-auto lg:max-h-[calc(100svh-140px)]"
        >
          <HeroPrinter />
        </motion.div>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: d + 1.1, duration: 0.8 }}
        className="mx-auto hidden max-w-[1500px] grid-cols-4 border-t border-bone/10 px-8 py-5 lg:grid"
      >
        {[
          [brand.followers, 'abonnés Instagram'],
          [String(brand.posts), 'publications'],
          ['58', 'wilayas livrées'],
          ['0,2 mm', 'par couche'],
        ].map(([n, l]) => (
          <div key={l} className="flex items-baseline gap-3">
            <span className="display text-[28px] tracking-[-0.04em]">{n}</span>
            <span className="mono text-smoke">{l}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
