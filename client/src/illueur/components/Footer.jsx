import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { brand, instagramDmUrl, instagramUrl } from '../config';
import { collections } from '../data/catalogue';
import { printEase, useReducedMotion } from '../lib/motion';
import { Magnetic } from './Chrome';

/**
 * The footer ends on the wordmark printed full width, layer by layer, as the
 * customer reaches the bottom of the page.
 */
export default function Footer() {
  const reduced = useReducedMotion();

  return (
    <footer className="relative overflow-hidden bg-ink text-bone">
      <div className="mx-auto max-w-[1500px] px-5 pt-24 sm:px-8 lg:pt-32">
        <div className="grid gap-14 lg:grid-cols-[1.8fr_1fr_1fr_1fr]">
          <div>
            <p className="mono text-smoke">Une pièce en tête ?</p>
            <h2 className="display mt-4 text-[clamp(44px,5vw,84px)]">
              Écris-nous,
              <br />
              <span className="serif-i font-normal text-ember">on l’imprime.</span>
            </h2>
            <Magnetic className="mt-10">
              <a
                href={instagramDmUrl}
                target="_blank"
                rel="noreferrer"
                data-cursor="DM"
                className="inline-flex h-16 items-center gap-3 rounded-full bg-bone px-8 text-lg font-semibold text-ink transition-colors hover:bg-ember"
              >
                Envoyer un DM <span aria-hidden="true">↗</span>
              </a>
            </Magnetic>
          </div>

          <div>
            <p className="mono text-smoke">Collections</p>
            <ul className="mt-5 flex flex-col gap-2 text-[17px]">
              {collections.map((c) => (
                <li key={c.slug}>
                  <Link to={`/collection/${c.slug}`} className="transition-colors hover:text-ember">
                    {c.nom}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mono text-smoke">Atelier</p>
            <ul className="mt-5 flex flex-col gap-2 text-[17px] text-bone/85">
              <li>Imprimé en PLA végétal</li>
              <li>Livraison 58 wilayas</li>
              <li>Paiement à la livraison</li>
              <li>Couleurs sur demande</li>
            </ul>
          </div>

          <div>
            <p className="mono text-smoke">Suivre</p>
            <ul className="mt-5 flex flex-col gap-2 text-[17px]">
              <li>
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-ember">
                  Instagram ↗
                </a>
              </li>
              <li className="text-bone/60">{brand.followers} abonnés</li>
              <li className="text-bone/60">{brand.posts} publications</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-20 select-none px-2" aria-hidden="true">
        <motion.p
          initial={reduced ? false : { clipPath: 'inset(100% 0 0 0)' }}
          whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
          viewport={{ once: true, margin: '0px 0px -5% 0px' }}
          transition={{ duration: 1.8, ease: printEase(28) }}
          className="display printed-text text-center text-[41vw] leading-[0.8] tracking-[-0.07em]"
        >
          illueur<span className="tracking-normal">.</span>
        </motion.p>
      </div>

      <div className="mx-auto flex max-w-[1500px] flex-col gap-2 border-t border-bone/10 px-5 py-6 sm:flex-row sm:justify-between sm:px-8">
        <span className="mono text-smoke">© {new Date().getFullYear()} {brand.atelier} — {brand.tagline}</span>
        <span className="mono text-smoke">Concept de site · démo</span>
      </div>
    </footer>
  );
}
