import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCatalogue } from '../lib/catalogue';
import { instagramDmUrl, showPrices } from '../config';
import { useSelection } from '../lib/selection';
import { EASE, printEase } from '../lib/motion';
import ProductArt from '../components/ProductArt';
import ProductCard, { Price } from '../components/ProductCard';
import { Magnetic, RiseLines } from '../components/Chrome';
import NotFound from './NotFound';
import { PageLoading, WishlistButton } from '../components/AccountUI';

export default function Piece() {
  const { slug } = useParams();
  const { productBySlug, ready } = useCatalogue();
  const p = productBySlug(slug);
  if (!p && !ready) return <PageLoading />;
  // Keyed on slug so moving between pieces resets the colour and quantity.
  return p ? <PieceView key={slug} p={p} /> : <NotFound />;
}

function PieceView({ p }) {
  const [color, setColor] = useState(p.couleurs[0]);
  const [qte, setQte] = useState(1);
  const [added, setAdded] = useState(false);
  const { add, setOpen } = useSelection();
  const { collectionBySlug, products } = useCatalogue();
  const coll = collectionBySlug(p.collection) || { slug: p.collection, nom: 'Collection' };
  const related = products.filter((x) => x.collection === p.collection && x.slug !== p.slug).slice(0, 3);
  const fill = related.length < 3 ? products.filter((x) => x.featured && x.collection !== p.collection).slice(0, 3 - related.length) : [];
  const dark = p.dark;

  const onAdd = () => {
    add(p.slug, color.nom, qte);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <>
      <section className="mx-auto grid max-w-[1500px] gap-8 px-3 pb-20 pt-24 sm:px-5 lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:px-8 lg:pt-28">
        <motion.div
          initial={{ clipPath: 'inset(100% 0 0 0 round 28px)' }}
          animate={{ clipPath: 'inset(0% 0 0 0 round 28px)' }}
          transition={{ duration: 1.1, ease: printEase(22), delay: 0.2 }}
          className="relative aspect-[4/5] overflow-hidden rounded-[28px] lg:sticky lg:top-24 lg:aspect-auto lg:h-[calc(100vh-120px)]"
        >
          <motion.div
            className="absolute inset-0"
            animate={{ backgroundColor: p.bg }}
            transition={{ duration: 0.6 }}
          />
          <div className={`absolute inset-0 ${dark ? 'layer-lines-light' : 'layer-lines'}`} />
          <div className="absolute inset-0">
            <ProductArt product={p} color={color.hex} draggable printOnView />
          </div>
          <WishlistButton slug={p.slug} size={48} tone={dark ? 'dark' : 'light'} className="absolute right-5 top-5" />
          {p.art.kind === 'layers' ? (
            <span className={`mono pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1.5 backdrop-blur ${dark ? 'border-bone/20 text-bone' : 'border-ink/15 text-ink'}`}>
              ← Glissez pour tourner →
            </span>
          ) : null}
        </motion.div>

        <div className="flex flex-col px-2 lg:py-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mono flex gap-2 text-ash"
          >
            <Link to="/" className="hover:text-ember">
              Accueil
            </Link>
            <span>/</span>
            <Link to={`/collection/${coll.slug}`} className="hover:text-ember">
              {coll.nom}
            </Link>
          </motion.div>

          <h1 className="display mt-6 text-[clamp(56px,7vw,120px)]">
            <RiseLines animateNow delay={0.3} lines={p.nom.split(' ').length > 2 ? [p.nom.split(' ').slice(0, 2).join(' '), p.nom.split(' ').slice(2).join(' ')] : [p.nom]} />
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.9, ease: EASE }}
          >
            <Price value={p.prix} className="mt-5 block text-[22px] font-medium" />
            <p className="mt-6 max-w-md text-[19px] leading-relaxed text-ink/80">{p.resume}</p>

            <div className="mt-10">
              <div className="flex items-baseline justify-between">
                <p className="mono text-ash">Couleur</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={color.nom}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="serif-i text-[22px]"
                  >
                    {color.nom}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="mt-3 flex gap-3">
                {p.couleurs.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    aria-label={c.nom}
                    aria-pressed={color.hex === c.hex}
                    onClick={() => setColor(c)}
                    className="relative h-12 w-12 rounded-full"
                  >
                    {color.hex === c.hex ? (
                      <motion.span layoutId="swatch" className="absolute -inset-1.5 rounded-full border-2 border-ink" transition={{ duration: 0.4, ease: EASE }} />
                    ) : null}
                    <span className="absolute inset-0 rounded-full border border-ink/15" style={{ background: c.hex }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <div className="flex h-14 items-center rounded-full border border-ink/15">
                <button type="button" aria-label="Moins" onClick={() => setQte((q) => Math.max(1, q - 1))} className="h-14 w-12 text-lg">
                  −
                </button>
                <span className="w-6 text-center font-mono">{qte}</span>
                <button type="button" aria-label="Plus" onClick={() => setQte((q) => Math.min(9, q + 1))} className="h-14 w-12 text-lg">
                  +
                </button>
              </div>
              <Magnetic strength={0.2} className="flex-1">
                <button
                  type="button"
                  onClick={onAdd}
                  className="group relative flex h-14 w-full min-w-[220px] items-center justify-center overflow-hidden rounded-full bg-ink px-8 font-semibold text-bone"
                >
                  <span className="absolute inset-0 origin-bottom scale-y-0 bg-ember transition-transform duration-500 ease-out-expo group-hover:scale-y-100" />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={added ? 'ok' : 'add'}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="relative group-hover:text-ink"
                    >
                      {added ? 'Ajouté ✓' : 'Ajouter à ma sélection'}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </Magnetic>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
              <button type="button" onClick={() => setOpen(true)} className="underline decoration-ink/30 underline-offset-4 hover:decoration-ember">
                Voir ma sélection
              </button>
              <a href={instagramDmUrl} target="_blank" rel="noreferrer" className="underline decoration-ink/30 underline-offset-4 hover:decoration-ember">
                {showPrices ? 'Une question ? DM ↗' : 'Demander le prix en DM ↗'}
              </a>
            </div>

            <dl className="mt-12 grid grid-cols-2 border-t border-ink/10">
              {[...Object.entries(p.specs || {}), ['matière', 'PLA végétal'], ['livraison', '58 wilayas']].map(([k, v], i) => (
                <motion.div
                  key={k}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.08, duration: 0.4, ease: printEase(4) }}
                  className="border-b border-ink/10 py-4 odd:pe-4 even:border-s even:ps-4"
                >
                  <dt className="mono text-ash">{k}</dt>
                  <dd className="mt-1 text-[17px] font-medium">{v}</dd>
                </motion.div>
              ))}
            </dl>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-ink/10">
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="display text-[clamp(40px,6vw,96px)]">
            Ça irait <span className="serif-i font-normal">bien avec</span>
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {[...related, ...fill].map((x, i) => (
              <ProductCard key={x.slug} product={x} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
