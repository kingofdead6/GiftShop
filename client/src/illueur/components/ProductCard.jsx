import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import ProductArt from './ProductArt';
import { WishlistButton } from './AccountUI';
import { formatDA, showPrices } from '../config';
import { collectionBySlug } from '../data/catalogue';
import { EASE, useReducedMotion } from '../lib/motion';

export function Price({ value, className = '' }) {
  return <span className={`font-mono tabular-nums ${className}`}>{showPrices ? formatDA(value) : 'Prix en DM'}</span>;
}

/**
 * A product card that behaves like an object on a turntable: it tilts toward
 * the pointer, the piece spins while hovered, and a nozzle line sweeps down
 * the frame as if it were being printed again.
 */
export default function ProductCard({ product, index = 0 }) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [color, setColor] = useState(product.couleurs[0].hex);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 200, damping: 20 });
  const glareX = useTransform(mx, (v) => `${v * 100}%`);
  const glareY = useTransform(my, (v) => `${v * 100}%`);
  const glare = useTransform([glareX, glareY], ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.55), transparent 45%)`);
  const coll = collectionBySlug(product.collection);
  const dark = product.dark;

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-6% 0px' }}
      transition={{ duration: 0.9, delay: (index % 4) * 0.08, ease: EASE }}
      className="group"
      style={{ perspective: 1000 }}
    >
      <Link
        to={`/piece/${product.slug}`}
        data-cursor="Voir"
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => {
          setHover(false);
          mx.set(0.5);
          my.set(0.5);
        }}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse') return;
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        className="block"
      >
        <motion.div
          style={reduced ? undefined : { rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
          className={`relative overflow-hidden rounded-[22px] aspect-[4/5]`}
        >
          <div className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]" style={{ background: product.bg }} />
          <div className={`absolute inset-0 ${dark ? 'layer-lines-light' : 'layer-lines'} opacity-60`} />

          <div className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:-translate-y-2">
            <ProductArt product={product} color={color} active={hover && !reduced} />
          </div>

          {/* The nozzle pass: an ember hairline sweeping the frame on hover. */}
          {!reduced ? (
            <motion.div
              aria-hidden="true"
              initial={false}
              animate={hover ? { top: ['0%', '100%'], opacity: [0, 1, 1, 0] } : { opacity: 0 }}
              transition={hover ? { duration: 1.4, ease: 'linear', repeat: Infinity, repeatDelay: 0.4 } : { duration: 0.2 }}
              className="pointer-events-none absolute inset-x-0 h-px bg-ember shadow-[0_0_14px_2px_rgba(255,79,26,0.7)]"
            />
          ) : null}

          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glare }}
          />

          <div className={`absolute inset-x-0 top-0 flex items-start justify-between p-4 ${dark ? 'text-bone' : 'text-ink'}`}>
            <span className="mono rounded-full border border-current/20 px-2.5 py-1 text-[10px] opacity-80 backdrop-blur-sm">
              {coll?.nom}
            </span>
            <span className="flex items-center gap-2">
              {coll?.nouveau ? (
                <span className="mono rounded-full bg-ember px-2.5 py-1 text-[10px] text-ink">Nouveau</span>
              ) : null}
              <WishlistButton slug={product.slug} size={34} tone={dark ? 'dark' : 'light'} />
            </span>
          </div>
        </motion.div>

        <div className="mt-4 flex items-start justify-between gap-3 px-1">
          <div>
            <h3 className="text-[19px] font-semibold leading-tight tracking-[-0.02em]">
              <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-out-expo group-hover:bg-[length:100%_1px]">
                {product.nom}
              </span>
            </h3>
            <Price value={product.prix} className="mt-1 block text-[13px] text-ash" />
          </div>
          <div className="flex gap-1.5 pt-1.5" onClick={(e) => e.preventDefault()}>
            {product.couleurs.map((c) => (
              <button
                key={c.hex}
                type="button"
                aria-label={c.nom}
                title={c.nom}
                data-cursor=""
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setColor(c.hex);
                }}
                className={`h-4 w-4 rounded-full border transition-transform duration-300 hover:scale-125 ${color === c.hex ? 'border-ink ring-2 ring-ink/15 ring-offset-1 ring-offset-bone' : 'border-ink/20'}`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
