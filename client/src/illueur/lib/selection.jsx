import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { brand, formatDA, showPrices } from '../config';
import { productBySlug } from '../data/catalogue';

/**
 * "Ma sélection" — the stand-in for a cart.
 *
 * The shop takes orders in Instagram DMs, so there is no checkout. Customers
 * pick pieces and colours here, and the site writes the DM for them: one tap
 * copies a tidy order message and opens the conversation.
 */

const KEY = 'illueur.selection.v1';
const Ctx = createContext(null);

const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((l) => productBySlug(l.slug)) : [];
  } catch {
    return [];
  }
};

export function SelectionProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // Private mode: the selection still works for this visit.
    }
  }, [items]);

  const add = useCallback((slug, couleur, qte = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((l) => l.slug === slug && l.couleur === couleur);
      if (i === -1) return [...prev, { slug, couleur, qte }];
      return prev.map((l, j) => (j === i ? { ...l, qte: Math.min(9, l.qte + qte) } : l));
    });
    setPulse((n) => n + 1);
  }, []);

  const setQte = useCallback((idx, qte) => {
    setItems((prev) => (qte <= 0 ? prev.filter((_, j) => j !== idx) : prev.map((l, j) => (j === idx ? { ...l, qte: Math.min(9, qte) } : l))));
  }, []);

  const value = useMemo(() => {
    const lines = items.map((l) => ({ ...l, product: productBySlug(l.slug) }));
    const count = items.reduce((n, l) => n + l.qte, 0);
    const total = lines.reduce((n, l) => n + l.product.prix * l.qte, 0);

    const message = () =>
      [
        `Salam ${brand.atelier} 👋`,
        'Je voudrais commander :',
        ...lines.map(
          (l) =>
            `• ${l.qte} × ${l.product.nom} — ${l.couleur}${showPrices ? ` (${formatDA(l.product.prix * l.qte)})` : ''}`
        ),
        showPrices ? `Total : ${formatDA(total)} + livraison` : null,
        'Wilaya : ',
        'Merci !',
      ]
        .filter((x) => x !== null)
        .join('\n');

    return { items, lines, count, total, open, setOpen, add, setQte, clear: () => setItems([]), message, pulse };
  }, [items, open, add, setQte, pulse]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSelection() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSelection must be used inside SelectionProvider');
  return ctx;
}
