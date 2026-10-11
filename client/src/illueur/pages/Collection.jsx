import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collectionBySlug, collections, productsIn } from '../data/catalogue';
import ProductCard from '../components/ProductCard';
import { RiseLines } from '../components/Chrome';
import { EASE } from '../lib/motion';
import NotFound from './NotFound';

export default function Collection() {
  const { slug } = useParams();
  const c = collectionBySlug(slug);
  if (!c) return <NotFound />;
  const items = productsIn(slug);
  const dark = c.tone === '#1C1A17';
  const i = collections.indexOf(c);
  const next = collections[(i + 1) % collections.length];

  return (
    <>
      <section className={`relative overflow-hidden pb-16 pt-36 lg:pb-24 lg:pt-44 ${dark ? 'text-bone' : 'text-ink'}`} style={{ background: c.tone }}>
        <div className={`absolute inset-0 ${dark ? 'layer-lines-light' : 'layer-lines'}`} />
        <div className="relative mx-auto max-w-[1500px] px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mono flex gap-2 opacity-70"
          >
            <Link to="/#collections" className="hover:text-ember">
              Collections
            </Link>
            <span>/</span>
            <span>
              0{i + 1} — {items.length} pièces
            </span>
          </motion.div>
          <h1 className="display mt-6 text-[clamp(64px,13vw,220px)]">
            <RiseLines animateNow delay={0.25} lines={[c.nom]} />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
            className="mt-6 max-w-lg text-[20px] opacity-80"
          >
            {c.accroche}
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, idx) => (
            <ProductCard key={p.slug} product={p} index={idx} />
          ))}
        </div>
      </section>

      <Link
        to={`/collection/${next.slug}`}
        data-cursor="Suivant"
        className="group block border-t border-ink/10"
      >
        <div className="mx-auto flex max-w-[1500px] items-end justify-between px-5 py-16 sm:px-8 lg:py-24">
          <div>
            <p className="mono text-ash">Collection suivante</p>
            <p className="display mt-4 text-[clamp(48px,9vw,150px)] transition-colors duration-500 group-hover:text-ember">{next.nom}</p>
          </div>
          <span className="display text-[clamp(48px,9vw,150px)] transition-transform duration-700 ease-out-expo group-hover:translate-x-4">→</span>
        </div>
      </Link>
    </>
  );
}
