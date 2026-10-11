import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { instagramDmUrl, whatsappUrl } from '../config';
import { useSelection } from '../lib/selection';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import { EASE, lockScroll } from '../lib/motion';
import ProductArt from './ProductArt';
import { Price } from './ProductCard';

/**
 * The selection drawer. Ends in the shop's real order channel: copy the
 * generated message, open the Instagram DM.
 */
export default function SelectionDrawer() {
  const { lines, open, setOpen, setQte, total, count, message, clear } = useSelection();
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    lockScroll(open);
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      lockScroll(false);
    };
  }, [open, setOpen]);

  /**
   * Logged-in customers get the demande saved to their account first, so the
   * DM carries its reference and they can follow it from /compte. If saving
   * fails the DM still goes out: the order channel never depends on the API.
   */
  const sendInstagram = async () => {
    // Opened synchronously, inside the click, or popup blockers eat it once
    // the save below has awaited.
    const tab = window.open('', '_blank');
    let numero = null;
    if (user) {
      setSending(true);
      try {
        const d = await api.createDemande({
          lignes: lines.map((l) => ({ slug: l.slug, nom: l.product.nom, couleur: l.couleur, qte: l.qte, prix: l.product.prix })),
          wilaya: user.wilaya,
        });
        numero = d.numero;
      } catch {
        // Fall through to a plain DM.
      } finally {
        setSending(false);
      }
    }
    try {
      await navigator.clipboard.writeText(message(numero, user?.wilaya));
      toast(numero ? `Demande ${numero} enregistrée. Message copié 👇` : 'Message copié. Colle-le dans la conversation 👇');
    } catch {
      toast('Ouvre la conversation et décris ta sélection.');
    }
    if (tab) tab.location.href = instagramDmUrl;
    else window.open(instagramDmUrl, '_blank', 'noopener');
    if (numero) {
      clear();
      setOpen(false);
    }
  };

  const wa = whatsappUrl(message(null, user?.wilaya));

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm"
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label="Ma sélection"
            initial={{ x: '105%' }}
            animate={{ x: 0 }}
            exit={{ x: '105%' }}
            transition={{ duration: 0.75, ease: EASE }}
            data-lenis-prevent
            className="fixed bottom-2 right-2 top-2 z-[61] flex w-[min(460px,calc(100vw-16px))] flex-col overflow-hidden rounded-[26px] bg-paper"
          >
            <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <div>
                <p className="mono text-ash">Ma sélection · {count}</p>
                <h2 className="display mt-1 text-[34px]">
                  Prêt à <span className="serif-i font-normal">commander</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-xl transition-transform duration-500 hover:rotate-90"
              >
                ×
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="display text-[64px] text-ink/10">vide.</p>
                  <p className="mt-2 max-w-[260px] text-ash">Ajoute des pièces depuis leur fiche, on prépare le message pour toi.</p>
                  <Link
                    to="/#pieces"
                    onClick={() => setOpen(false)}
                    className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-medium text-bone"
                  >
                    Voir les pièces
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {lines.map((l, i) => (
                      <motion.li
                        key={`${l.slug}-${l.couleur}`}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.45, ease: EASE }}
                        className="flex gap-4 rounded-2xl bg-bone p-3"
                      >
                        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl" style={{ background: l.product.bg }}>
                          <ProductArt
                            product={l.product}
                            color={l.product.couleurs.find((c) => c.nom === l.couleur)?.hex}
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between py-1">
                          <div>
                            <p className="font-semibold leading-tight">{l.product.nom}</p>
                            <p className="mono mt-1 text-[10px] text-ash">{l.couleur}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center rounded-full border border-ink/15">
                              <button type="button" aria-label="Moins" onClick={() => setQte(i, l.qte - 1)} className="h-8 w-8">
                                −
                              </button>
                              <span className="w-5 text-center font-mono text-sm">{l.qte}</span>
                              <button type="button" aria-label="Plus" onClick={() => setQte(i, l.qte + 1)} className="h-8 w-8">
                                +
                              </button>
                            </div>
                            <Price value={l.product.prix * l.qte} className="text-sm" />
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {lines.length ? (
              <footer className="border-t border-ink/10 px-6 pb-6 pt-4">
                <div className="mb-4 flex items-baseline justify-between">
                  <span className="mono text-ash">Total (hors livraison)</span>
                  <Price value={total} className="text-lg font-semibold" />
                </div>
                <button
                  type="button"
                  onClick={sendInstagram}
                  className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-ink font-medium text-bone"
                >
                  <span className="absolute inset-0 origin-bottom scale-y-0 bg-ember transition-transform duration-500 ease-out-expo group-hover:scale-y-100" />
                  <span className="relative transition-colors group-hover:text-ink">{sending ? 'Enregistrement…' : 'Commander sur Instagram ↗'}</span>
                </button>
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex h-12 w-full items-center justify-center rounded-full border border-ink/15 text-sm font-medium"
                  >
                    ou sur WhatsApp
                  </a>
                ) : null}
                <p className="mt-3 text-center text-[12px] text-ash">
                  {user ? (
                    'Ta demande est gardée dans ton compte. On copie le message, tu le colles dans le DM.'
                  ) : (
                    <>
                      On copie ta commande, tu la colles dans le DM.{' '}
                      <Link to="/connexion" onClick={() => setOpen(false)} className="underline underline-offset-2">
                        Connecte-toi
                      </Link>{' '}
                      pour la suivre.
                    </>
                  )}
                </p>
              </footer>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
