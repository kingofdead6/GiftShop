import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useInView, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { avis, collections, products, productsIn, wilayas } from '../data/catalogue';
import { brand, showPrices } from '../config';
import { drawPrint, fitCanvas } from '../lib/layerRender';
import { EASE, printEase, useReducedMotion } from '../lib/motion';
import ProductCard from '../components/ProductCard';
import ProductArt from '../components/ProductArt';
import Figure from '../components/Figures';
import { PrintText, RiseLines, VelocityMarquee } from '../components/Chrome';

function Eyebrow({ n, children, light = false }) {
  return (
    <p className={`mono flex items-center gap-3 ${light ? 'text-smoke' : 'text-ash'}`}>
      <span className={`rounded-full border px-2 py-0.5 ${light ? 'border-bone/20' : 'border-ink/20'}`}>{n}</span>
      {children}
    </p>
  );
}

// ── Marquee ─────────────────────────────────────────────────────────────────

export function Marquee() {
  const items = ['Design & Décor', 'Made in Algeria', 'Imprimé couche par couche', 'Livraison 58 wilayas', 'PLA végétal'];
  return (
    <div className="relative z-10 -mt-px bg-ember py-5 text-ink">
      <VelocityMarquee>
        {items.map((t, i) => (
          <span key={t} className="flex items-center">
            <span className={`px-6 text-[clamp(32px,5vw,64px)] leading-none ${i % 2 ? 'serif-i' : 'display'}`}>{t}</span>
            <span className="text-[28px]">✦</span>
          </span>
        ))}
      </VelocityMarquee>
    </div>
  );
}

// ── Manifesto: words light up with the scroll ───────────────────────────────

function Word({ children, range, progress }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block pe-[0.25em]">
      {children}
    </motion.span>
  );
}

export function Manifesto() {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const text =
    "On dessine des objets qu'on ne trouve nulle part ailleurs. Puis on les imprime nous-mêmes, à l'atelier, une couche de 0,2 mm après l'autre. Des vases froissés, des lampes qui ondulent, et des petites têtes qui gardent vos lunettes.";
  const words = text.split(' ');

  return (
    <section className="mx-auto max-w-[1500px] px-5 py-28 sm:px-8 lg:py-44">
      <Eyebrow n="01">L’atelier en deux phrases</Eyebrow>
      <p ref={ref} className="mt-10 max-w-[1200px] text-[clamp(30px,4.6vw,72px)] font-semibold leading-[1.04] tracking-[-0.035em]">
        {words.map((w, i) =>
          reduced ? (
            <span key={i}>{w} </span>
          ) : (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {w === '0,2' ? <span className="serif-i font-normal text-ember">0,2</span> : w}
            </Word>
          )
        )}
      </p>
    </section>
  );
}

// ── Drop: the incense collection ────────────────────────────────────────────

export function Drop() {
  const items = productsIn('encens');
  const reduced = useReducedMotion();

  return (
    <section id="drop" className="relative overflow-hidden bg-ink py-24 text-bone lg:py-36">
      <div aria-hidden="true" className="layer-lines-light absolute inset-0" />
      <div className="relative mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <Eyebrow n="02" light>
              Nouvelle collection
            </Eyebrow>
            <h2 className="display mt-6 text-[clamp(52px,9vw,150px)]">
              <RiseLines lines={['Quatre gardiens', <span key="s" className="serif-i font-normal text-ember">pour votre encens.</span>]} />
            </h2>
          </div>
          <p className="max-w-sm text-bone/70">
            Samurai, Meow, Alien et Moai. Le bâton se plante derrière, la fumée monte, votre salon sent bon. Imprimés à la
            commande, en trois couleurs chacun.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {items.map((p, i) => (
            <motion.div
              key={p.slug}
              initial={reduced ? false : { opacity: 0, y: 80, rotate: i % 2 ? 3 : -3 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 1, delay: i * 0.1, ease: EASE }}
            >
              <Link
                to={`/piece/${p.slug}`}
                data-cursor="Voir"
                className="group relative block aspect-[3/4] overflow-hidden rounded-[22px]"
                style={{ background: p.bg }}
              >
                <div className="layer-lines absolute inset-0" />
                <div className="absolute inset-0 p-[6%] transition-transform duration-700 ease-out-expo group-hover:-translate-y-3 group-hover:scale-[1.06]">
                  <Figure figure={p.art.figure} color={p.couleurs[0].hex} className="h-full w-full" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-ink">
                  <span className="display text-[clamp(28px,3.4vw,48px)]">{p.nom}</span>
                  <span className="mono mb-1.5 opacity-60">0{i + 1}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Collections: horizontal scroll, pinned ──────────────────────────────────

function CollectionPanel({ c, i }) {
  const items = productsIn(c.slug);
  const hero = items.find((p) => p.art.shape === c.hero || p.art.figure === c.hero) || items[0];
  const dark = c.tone === '#1C1A17';
  return (
    <Link
      to={`/collection/${c.slug}`}
      data-cursor="Explorer"
      className={`group relative flex h-full w-[82vw] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-[28px] p-6 sm:w-[62vw] sm:p-8 lg:w-[46vw] ${dark ? 'text-bone' : 'text-ink'}`}
      style={{ background: c.tone }}
    >
      <div className={`absolute inset-0 ${dark ? 'layer-lines-light' : 'layer-lines'}`} />
      <div className="absolute right-[-6%] top-[12%] h-[50%] w-[80%] transition-transform sm:inset-y-0 sm:h-auto sm:w-[70%] duration-1000 ease-out-expo group-hover:scale-105 group-hover:-rotate-2">
        <ProductArt product={hero} active />
      </div>
      <div className="relative flex items-center justify-between">
        <span className="mono opacity-70">
          0{i + 1} / 0{collections.length}
        </span>
        <span className="mono rounded-full border border-current/25 px-3 py-1 opacity-80">
          {items.length} pièces
        </span>
      </div>
      <div className="relative max-w-[60%]">
        {c.nouveau ? <span className="mono mb-3 inline-block rounded-full bg-ember px-2.5 py-1 text-ink">Nouveau</span> : null}
        <h3 className="display text-[clamp(40px,5.4vw,92px)]">{c.nom}</h3>
        <p className="mt-3 max-w-xs opacity-75">{c.accroche}</p>
        <span className="mt-6 inline-flex items-center gap-2 font-semibold">
          Explorer
          <span className="transition-transform duration-500 ease-out-expo group-hover:translate-x-2">→</span>
        </span>
      </div>
    </Link>
  );
}

export function Collections() {
  const ref = useRef(null);
  const track = useRef(null);
  const reduced = useReducedMotion();
  const [distance, setDistance] = useState(0);
  const dist = useRef(0);
  dist.current = distance;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  // Read through a ref: the track width is only known after layout and
  // changes on resize, and the transform must follow it.
  const x = useSpring(useTransform(scrollYProgress, (v) => -v * dist.current), { stiffness: 120, damping: 30, mass: 0.4 });
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    const measure = () => {
      const fine = window.matchMedia('(min-width: 768px)').matches && !reduced;
      setPinned(fine);
      if (track.current) setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [reduced]);

  const header = (
    <div className="mx-auto flex w-full max-w-[1500px] items-end justify-between px-5 sm:px-8">
      <div>
        <Eyebrow n="03">Collections</Eyebrow>
        <h2 className="display mt-5 text-[clamp(48px,7vw,112px)]">
          Cinq familles, <span className="serif-i font-normal">un atelier.</span>
        </h2>
      </div>
      {pinned ? (
        <div className="mb-4 hidden h-[3px] w-48 overflow-hidden rounded-full bg-ink/10 lg:block">
          <motion.div style={{ width: bar }} className="h-full bg-ember" />
        </div>
      ) : null}
    </div>
  );

  const panels = collections.map((c, i) => <CollectionPanel key={c.slug} c={c} i={i} />);

  if (!pinned) {
    return (
      <section id="collections" className="py-24">
        {header}
        <div className="mt-10 flex h-[68vh] min-h-[460px] snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
          {panels}
        </div>
      </section>
    );
  }

  return (
    <section id="collections" ref={ref} style={{ height: `calc(100vh + ${distance}px)` }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center gap-10 overflow-hidden pt-20">
        {header}
        <motion.div ref={track} style={{ x }} className="flex h-[62vh] gap-5 px-8">
          {panels}
          <div className="w-[8vw] shrink-0" />
        </motion.div>
      </div>
    </section>
  );
}

// ── All pieces, filterable ──────────────────────────────────────────────────

export function Pieces() {
  const [filter, setFilter] = useState('tout');
  const list = filter === 'tout' ? products : products.filter((p) => p.collection === filter);
  const chips = [{ slug: 'tout', nom: 'Tout' }, ...collections];

  return (
    <section id="pieces" className="mx-auto max-w-[1500px] px-5 py-24 sm:px-8 lg:py-32">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <Eyebrow n="04">Catalogue</Eyebrow>
          <h2 className="display mt-5 text-[clamp(52px,8vw,128px)]">
            <PrintText>Les pièces</PrintText>
            <sup className="mono ms-2 align-top text-[14px] tracking-normal text-ember">({list.length})</sup>
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setFilter(c.slug)}
              className="relative h-11 rounded-full border border-ink/15 px-5 text-[15px] font-medium"
            >
              {filter === c.slug ? (
                <motion.span layoutId="chip" transition={{ duration: 0.5, ease: EASE }} className="absolute inset-0 rounded-full bg-ink" />
              ) : null}
              <span className={`relative transition-colors duration-300 ${filter === c.slug ? 'text-bone' : ''}`}>{c.nom}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="mt-14 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.div
              key={p.slug}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <ProductCard product={p} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

// ── Atelier: the scroll prints the vase ─────────────────────────────────────

const STEPS = [
  { t: 'Dessin', d: 'Chaque pièce part d’un croquis, puis d’un modèle 3D dessiné à l’atelier. Pas de fichier téléchargé.', k: 'Modèle · .3mf' },
  { t: 'Tranchage', d: 'Le modèle est découpé en centaines de couches de 0,2 mm. La texture se règle ici, couche par couche.', k: '96 couches · 0,2 mm' },
  { t: 'Impression', d: 'L’imprimante dépose le PLA fondu à 220 °C, des heures durant. Une pièce, une impression.', k: 'Buse 0,4 · 220 °C' },
  { t: 'Finition', d: 'Contrôle, ébavurage, emballage solide, et départ vers votre wilaya.', k: 'Emballé · Expédié' },
];

function ScrollPrinter({ progress }) {
  const ref = useRef(null);
  const draw = (p) => {
    const canvas = ref.current;
    if (!canvas) return;
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    drawPrint(ctx, w, h, { shape: 'sculpte', color: '#3E8A62', progress: p, rotation: 0.3 + p * 3, nozzle: p < 1 && p > 0, rail: true, tilt: 0.3 });
  };
  useMotionValueEvent(progress, 'change', draw);
  useEffect(() => {
    draw(progress.get());
    const ro = new ResizeObserver(() => draw(progress.get()));
    ro.observe(ref.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas ref={ref} className="h-full w-full" aria-hidden="true" />;
}

export function Atelier() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.6', 'end 0.8'] });
  const printP = useTransform(scrollYProgress, [0.1, 0.85], [0, 1], { clamp: true });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStep(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)))));
  const pctText = useTransform(printP, (v) => `${String(Math.round(v * 100)).padStart(3, '0')}%`);

  return (
    <section id="atelier" ref={ref} className="bg-paper">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-32">
        <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-center">
          <Eyebrow n="05">Du fichier à votre étagère</Eyebrow>
          <h2 className="display mt-5 text-[clamp(48px,6.4vw,104px)]">
            Fait <span className="serif-i font-normal">ici,</span>
            <br />
            couche par couche.
          </h2>
          <div className="relative mt-8 aspect-square max-h-[56vh] w-full overflow-hidden rounded-[28px] bg-ink">
            <div className="layer-lines-light absolute inset-0" />
            <ScrollPrinter progress={printP} />
            <div className="absolute left-5 top-5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ember ember" />
              <span className="mono text-bone">{STEPS[step].t}</span>
            </div>
            <motion.span className="mono absolute bottom-5 right-5 text-smoke">{pctText}</motion.span>
            <span className="mono absolute bottom-5 left-5 text-smoke">{STEPS[step].k}</span>
          </div>
        </div>

        <ol className="flex flex-col lg:py-[30vh]">
          {STEPS.map((s, i) => (
            <li key={s.t} className="flex min-h-[38vh] flex-col justify-center border-t border-ink/10 py-10">
              <motion.div animate={{ opacity: step === i ? 1 : 0.28 }} transition={{ duration: 0.5 }}>
                <span className="mono text-ember">Étape 0{i + 1}</span>
                <h3 className="display mt-3 text-[clamp(40px,4.5vw,72px)]">{s.t}</h3>
                <p className="mt-4 max-w-md text-[18px] leading-relaxed text-ash">{s.d}</p>
              </motion.div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── "Prix ?" ────────────────────────────────────────────────────────────────

const COMMENTS = ['prix ?', 'prix svp 🙏', 'combien ?', 'prix ??', 'b9adech ?', 'prix et livraison', 'dm prix', 'prix ?'];
// Hand-placed so the pile looks like a flood, not a collision.
const SPOTS = [[2, 4], [50, 0], [14, 26], [58, 24], [0, 52], [44, 50], [14, 80], [56, 78]];

export function Prix() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-25% 0px' });
  const reduced = useReducedMotion();

  return (
    <section ref={ref} className="relative overflow-hidden bg-lemon py-24 lg:py-36">
      <div className="layer-lines absolute inset-0" />
      <div className="relative mx-auto grid max-w-[1500px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <div className="relative h-[420px]">
          {COMMENTS.map((c, i) => (
            <motion.div
              key={i}
              initial={reduced ? false : { opacity: 0, scale: 0.5, y: 30 }}
              animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 380, damping: 20 }}
              className="absolute flex items-center gap-2 rounded-2xl bg-paper px-4 py-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)]"
              style={{ left: `${SPOTS[i][0]}%`, top: `${SPOTS[i][1]}%`, rotate: `${((i * 7) % 11) - 5}deg` }}
            >
              <span className="h-7 w-7 rounded-full" style={{ background: ['#C49A6C', '#4E8F4A', '#B3261E', '#A99BD4'][i % 4] }} />
              <span className="font-medium">{c}</span>
            </motion.div>
          ))}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 2.4, rotate: -24 }}
              animate={inView ? { opacity: 1, scale: 1, rotate: -8 } : {}}
              transition={{ delay: COMMENTS.length * 0.12 + 0.3, duration: 0.45, ease: [0.5, 0, 0.75, 0] }}
              className="rounded-xl border-4 border-ember bg-lemon/80 px-5 py-2 text-ember backdrop-blur-sm"
            >
              <span className="display whitespace-nowrap text-[clamp(36px,5vw,56px)]">RÉPONDU.</span>
            </motion.div>
          </div>
        </div>

        <div>
          <Eyebrow n="06">La question</Eyebrow>
          <h2 className="display mt-5 text-[clamp(64px,10vw,170px)]">
            Prix<span className="text-ember"> ?</span>
          </h2>
          <p className="mt-6 max-w-md text-[20px] leading-snug">
            {showPrices
              ? 'Rahom hna. Chaque pièce affiche son prix, ses couleurs et ses dimensions. Vous choisissez, on prépare le message, vous l’envoyez en DM.'
              : 'Toujours en DM, mais avec la pièce, la couleur et la quantité déjà écrites. Une conversation, pas dix.'}
          </p>
          <p className="mono mt-6 text-ash">Fini les « prix ? » sans réponse en commentaire.</p>
        </div>
      </div>
    </section>
  );
}

// ── Reviews, as DM bubbles ──────────────────────────────────────────────────

function Bubble({ a }) {
  return (
    <div className="mx-2 w-[300px] shrink-0 rounded-[22px] bg-paper p-5 sm:w-[360px]">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-mono text-xs uppercase text-bone">{a.nom[0]}</span>
        <div>
          <p className="text-sm font-semibold">@{a.nom}</p>
          <p className="mono text-[10px] text-ash">{a.wilaya}</p>
        </div>
      </div>
      <p className="mt-4 whitespace-normal text-[17px] leading-snug">{a.texte}</p>
    </div>
  );
}

export function Avis() {
  const half = Math.ceil(avis.length / 2);
  return (
    <section className="overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <Eyebrow n="07">Dans nos DM</Eyebrow>
        <h2 className="display mt-5 text-[clamp(48px,7vw,112px)]">
          Ils ont <span className="serif-i font-normal">reçu.</span>
        </h2>
      </div>
      <div className="mt-14 flex flex-col gap-4">
        {[avis.slice(0, half), avis.slice(half)].map((row, r) => (
          <div key={r} className="marquee overflow-hidden">
            <div className={`marquee-track flex w-max ${r ? 'rev' : ''}`} style={{ '--dur': `${50 + r * 12}s` }}>
              {[...row, ...row].map((a, i) => (
                <Bubble key={i} a={a} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Delivery ────────────────────────────────────────────────────────────────

function Counter({ to, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!inView) return undefined;
    if (reduced) {
      setN(to);
      return undefined;
    }
    let raf;
    const s = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - s) / 1600);
      setN(Math.round((1 - (1 - k) ** 3) * to));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, reduced]);
  return (
    <span ref={ref} className={className}>
      {n}
    </span>
  );
}

function WilayaTicker() {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return undefined;
    const id = setInterval(() => setI((x) => (x + 1) % wilayas.length), 900);
    return () => clearInterval(id);
  }, [reduced]);
  return (
    <span className="relative inline-flex h-[1.1em] overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={i}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.5, ease: EASE }}
          className="serif-i whitespace-nowrap text-ember"
        >
          {wilayas[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Livraison() {
  const steps = [
    ['Vous choisissez', 'Pièce, couleur, quantité. Ajoutez-les à votre sélection.'],
    ['On en parle en DM', `Le message est prêt, envoyez-le sur @${brand.instagram}. On confirme le délai.`],
    ['Livré chez vous', 'Emballage solide, paiement à la livraison, dans les 58 wilayas.'],
  ];
  return (
    <section id="livraison" className="bg-ink text-bone">
      <div className="mx-auto max-w-[1500px] px-5 py-24 sm:px-8 lg:py-36">
        <Eyebrow n="08" light>
          Livraison
        </Eyebrow>
        <div className="mt-8 grid items-end gap-10 lg:grid-cols-[auto_1fr]">
          <Counter to={58} className="display text-[clamp(160px,30vw,420px)] leading-[0.75] tracking-[-0.08em] text-ember" />
          <p className="display pb-[2%] text-[clamp(36px,5vw,84px)]">
            wilayas.
            <br />
            Direction <WilayaTicker />
          </p>
        </div>
        <ol className="mt-20 grid gap-3 md:grid-cols-3">
          {steps.map(([t, d], i) => (
            <motion.li
              key={t}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: EASE }}
              className="rounded-[22px] border border-bone/10 p-7"
            >
              <span className="mono text-ember">0{i + 1}</span>
              <h3 className="mt-8 text-[26px] font-semibold tracking-[-0.02em]">{t}</h3>
              <p className="mt-2 text-bone/65">{d}</p>
            </motion.li>
          ))}
        </ol>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: printEase(8) }}
          className="mono mt-10 text-smoke"
        >
          Délais et frais selon la wilaya, confirmés en DM.
        </motion.p>
      </div>
    </section>
  );
}
