import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { setCatalogue } from '../lib/catalogue';
import { EASE, lockScroll } from '../lib/motion';
import { SHAPES } from '../lib/layerRender';
import { formatDA } from '../config';
import ProductArt from '../components/ProductArt';
import { Field, PrintDots } from '../components/AccountUI';

/**
 * Admin: the catalogue. Pieces and collections, created, edited, reordered,
 * hidden and deleted here, and pushed to the live storefront on every save.
 */

const FIGURE_LABELS = {
  moai: 'Moai',
  meow: 'Chat (Meow)',
  alien: 'Alien',
  samurai: 'Samurai',
  gorille: 'Gorille',
  ours: 'Ours',
  rhino: 'Rhino',
  buste: 'Buste grec',
  atlas: 'Atlas',
  noeud: 'Nœud',
};

// ── Shared data hook ────────────────────────────────────────────────────────

export function useAdminCatalogue() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const ctrl = new AbortController();
    api.admin
      .catalogue(ctrl.signal)
      .then(setData)
      .catch((err) => err.name !== 'AbortError' && setError(err.message));
    return () => ctrl.abort();
  }, []);

  useEffect(() => load(), [load]);

  /** Apply a change locally and push the visible catalogue to the storefront. */
  const commit = useCallback((next) => {
    setData((prev) => {
      const merged = { ...prev, ...next };
      setCatalogue(merged.collections, merged.products.filter((p) => p.actif !== false));
      return merged;
    });
  }, []);

  return { data, error, commit, reload: load };
}

// ── Small controls ──────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-paper px-4 py-3">
      <span>
        <span className="block text-[15px] font-medium">{label}</span>
        {hint ? <span className="block text-[13px] text-ash">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-ember' : 'bg-ink/15'}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
          className={`absolute top-1 h-5 w-5 rounded-full bg-paper shadow ${checked ? 'right-1' : 'left-1'}`}
        />
      </button>
    </label>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mono text-ash">{label}</span>
      <span className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-ink/15 bg-paper px-3">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className="w-full bg-transparent font-mono text-[15px] uppercase outline-none"
        />
      </span>
    </label>
  );
}

function IconButton({ onClick, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-[14px] transition-colors hover:border-ink disabled:opacity-25"
    >
      {children}
    </button>
  );
}

/** Two-step delete: the first click arms it, the second confirms. */
function DeleteButton({ onConfirm, label = 'Supprimer', disabled }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
          return;
        }
        setArmed(true);
        timer.current = setTimeout(() => setArmed(false), 3500);
      }}
      className={`h-12 rounded-full px-5 text-[14px] font-medium transition-colors disabled:opacity-40 ${
        armed ? 'bg-ember text-ink' : 'border border-ink/15 text-ink hover:border-ember hover:text-ember'
      }`}
    >
      {armed ? 'Confirmer la suppression' : label}
    </button>
  );
}

function Drawer({ open, onClose, title, children, footer }) {
  useEffect(() => {
    lockScroll(open);
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      lockScroll(false);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm"
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-label={title}
            initial={{ x: '105%' }}
            animate={{ x: 0 }}
            exit={{ x: '105%' }}
            transition={{ duration: 0.6, ease: EASE }}
            data-lenis-prevent
            className="fixed bottom-2 right-2 top-2 z-[61] flex w-[min(720px,calc(100vw-16px))] flex-col overflow-hidden rounded-[26px] bg-bone"
          >
            <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
              <h2 className="display text-[30px]">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-xl transition-transform duration-500 hover:rotate-90"
              >
                ×
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {footer ? <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 px-6 py-4">{footer}</footer> : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function SaveButton({ saving, children = 'Enregistrer' }) {
  return (
    <button
      type="submit"
      form="catalogue-form"
      disabled={saving}
      className="group relative flex h-12 min-w-[180px] items-center justify-center gap-3 overflow-hidden rounded-full bg-ink px-6 font-semibold text-bone disabled:opacity-70"
    >
      <span className="absolute inset-0 origin-bottom scale-y-0 bg-ember transition-transform duration-500 ease-out-expo group-hover:scale-y-100" />
      <span className="relative flex items-center gap-3 group-hover:text-ink">
        {saving ? <PrintDots /> : null}
        {children}
      </span>
    </button>
  );
}

// ── Piece editor ────────────────────────────────────────────────────────────

const emptyPiece = (collection) => ({
  nom: '',
  collection,
  prix: 2500,
  resume: '',
  couleurs: [{ nom: 'Blanc os', hex: '#EEE8DC' }],
  art: { kind: 'layers', shape: 'kraft', figure: null, glow: false },
  bg: '#EFE4D2',
  dark: false,
  featured: false,
  actif: true,
  specs: [
    { k: 'hauteur', v: '' },
    { k: 'impression', v: '' },
    { k: 'couche', v: '0,2 mm' },
  ],
});

const toForm = (p) => ({
  ...p,
  art: { kind: p.art?.kind || 'layers', shape: p.art?.shape || 'kraft', figure: p.art?.figure || 'moai', glow: Boolean(p.art?.glow) },
  specs: Object.entries(p.specs || {}).map(([k, v]) => ({ k, v })),
});

function PieceEditor({ piece, collections, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState(() => (piece.id ? toForm(piece) : piece));
  // Once created, the same drawer keeps editing the new piece.
  const id = form.id || piece.id;
  const isNew = !id;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewColor, setPreviewColor] = useState(0);
  const fileRef = useRef(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const preview = useMemo(
    () => ({
      ...form,
      slug: form.slug || 'apercu',
      couleurs: form.couleurs.length ? form.couleurs : [{ nom: '—', hex: '#cccccc' }],
      art: { ...form.art, shape: form.art.kind === 'layers' ? form.art.shape : null, figure: form.art.kind === 'figure' ? form.art.figure : null },
      specs: {},
    }),
    [form]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim()) return toast.error('Donnez un nom à la pièce');
    if (!form.couleurs.length) return toast.error('Au moins une couleur');
    setSaving(true);
    try {
      const body = {
        nom: form.nom,
        collection: form.collection,
        prix: form.prix,
        resume: form.resume,
        couleurs: form.couleurs,
        art: form.art,
        bg: form.bg,
        dark: form.dark,
        featured: form.featured,
        actif: form.actif,
        specs: form.specs,
      };
      const saved = isNew ? await api.admin.createPiece(body) : await api.admin.updatePiece(id, body);
      onSaved(saved, isNew);
      toast(isNew ? `${saved.nom} créée ✓ Ajoutez une photo si vous voulez.` : `${saved.nom} enregistrée ✓`);
      if (isNew) setForm(toForm(saved));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  const upload = async (file) => {
    if (!file || !id) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image trop lourde (5 Mo max)');
    setUploading(true);
    try {
      const saved = await api.admin.uploadPhoto(id, file);
      set({ photo: saved.photo });
      onSaved(saved, false);
      toast('Photo ajoutée ✓');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
    return undefined;
  };

  const removePhoto = async () => {
    setUploading(true);
    try {
      const saved = await api.admin.deletePhoto(id);
      set({ photo: '' });
      onSaved(saved, false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    try {
      await api.admin.deletePiece(id);
      onDeleted(id);
      toast(`${form.nom} supprimée`);
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? 'Nouvelle pièce' : form.nom || 'Pièce'}
      footer={
        <>
          {id ? <DeleteButton onConfirm={remove} /> : <span />}
          <SaveButton saving={saving}>{isNew ? 'Créer la pièce' : 'Enregistrer'}</SaveButton>
        </>
      }
    >
      <form id="catalogue-form" onSubmit={submit} className="flex flex-col gap-8">
        {/* Live preview */}
        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[22px]" style={{ background: form.bg }}>
            <div className={`absolute inset-0 ${form.dark ? 'layer-lines-light' : 'layer-lines'}`} />
            <ProductArt product={preview} color={preview.couleurs[previewColor]?.hex || preview.couleurs[0].hex} active />
            {!form.actif ? <span className="mono absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[10px] text-bone">Masquée</span> : null}
          </div>
          <div className="flex flex-col gap-4">
            <Field label="Nom" value={form.nom} onChange={(e) => set({ nom: e.target.value })} placeholder="Vase Sac Kraft" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Collection" as="select" value={form.collection} onChange={(e) => set({ collection: e.target.value })}>
                {collections.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nom}
                  </option>
                ))}
              </Field>
              <Field label="Prix (DA)" type="number" min="0" step="any" value={form.prix} onChange={(e) => set({ prix: e.target.value })} />
            </div>
            {form.slug ? (
              <p className="mono text-ash">
                Lien : /piece/{form.slug}{' '}
                {form.id ? (
                  <Link to={`/piece/${form.slug}`} target="_blank" className="text-ember underline">
                    voir ↗
                  </Link>
                ) : null}
              </p>
            ) : (
              <p className="mono text-ash">Le lien sera créé à partir du nom.</p>
            )}
          </div>
        </div>

        <Field label="Description" as="textarea" value={form.resume} onChange={(e) => set({ resume: e.target.value })} rows={3} placeholder="Une phrase ou deux sur la pièce." />

        {/* Colours */}
        <section>
          <div className="flex items-center justify-between">
            <p className="mono text-ash">Couleurs ({form.couleurs.length}/8)</p>
            <button
              type="button"
              disabled={form.couleurs.length >= 8}
              onClick={() => set({ couleurs: [...form.couleurs, { nom: 'Nouvelle', hex: '#C49A6C' }] })}
              className="text-[14px] underline underline-offset-4 hover:text-ember disabled:opacity-30"
            >
              + Ajouter
            </button>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {form.couleurs.map((c, i) => (
              <li key={i} className={`flex items-center gap-3 rounded-2xl border bg-paper p-2 ${previewColor === i ? 'border-ink' : 'border-ink/10'}`}>
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => set({ couleurs: form.couleurs.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) })}
                  onFocus={() => setPreviewColor(i)}
                  className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                />
                <input
                  value={c.nom}
                  onChange={(e) => set({ couleurs: form.couleurs.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)) })}
                  onFocus={() => setPreviewColor(i)}
                  maxLength={40}
                  className="h-10 flex-1 bg-transparent text-[15px] outline-none"
                />
                <span className="font-mono text-[12px] uppercase text-ash">{c.hex}</span>
                <IconButton
                  label="Retirer"
                  disabled={form.couleurs.length <= 1}
                  onClick={() => {
                    set({ couleurs: form.couleurs.filter((_, j) => j !== i) });
                    setPreviewColor(0);
                  }}
                >
                  ×
                </IconButton>
              </li>
            ))}
          </ul>
        </section>

        {/* Look */}
        <section className="flex flex-col gap-4">
          <p className="mono text-ash">Apparence</p>
          <div className="rounded-[22px] border border-ink/10 bg-paper p-4">
            <div className="flex items-center gap-4">
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-bone">
                {form.photo ? <img src={form.photo} alt="" className="h-full w-full object-cover" /> : <span className="mono flex h-full items-center justify-center text-[10px] text-ash">Pas de photo</span>}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium">Photo</p>
                <p className="text-[13px] text-ash">
                  {id ? 'Une vraie photo remplace le dessin sur le site. JPG, PNG ou WebP, 5 Mo max.' : 'Disponible après la création de la pièce.'}
                </p>
                <div className="mt-3 flex gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
                  <button
                    type="button"
                    disabled={!id || uploading}
                    onClick={() => fileRef.current?.click()}
                    className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-medium text-bone disabled:opacity-40"
                  >
                    {uploading ? <PrintDots /> : null}
                    {form.photo ? 'Remplacer' : 'Téléverser'}
                  </button>
                  {form.photo ? (
                    <button type="button" disabled={uploading} onClick={removePhoto} className="h-10 rounded-full border border-ink/15 px-4 text-[14px]">
                      Retirer
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              ['layers', 'Forme imprimée', 'Vases, lampes : rendu couche par couche'],
              ['figure', 'Figure low-poly', 'Encens, porte-lunettes, statement'],
            ].map(([k, label, hint]) => (
              <button
                key={k}
                type="button"
                onClick={() => set({ art: { ...form.art, kind: k } })}
                className={`rounded-2xl border p-4 text-start transition-colors ${form.art.kind === k ? 'border-ink bg-ink text-bone' : 'border-ink/10 bg-paper hover:border-ink/40'}`}
              >
                <span className="block font-medium">{label}</span>
                <span className={`block text-[13px] ${form.art.kind === k ? 'text-bone/70' : 'text-ash'}`}>{hint}</span>
              </button>
            ))}
          </div>
          {form.art.kind === 'layers' ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Forme" as="select" value={form.art.shape} onChange={(e) => set({ art: { ...form.art, shape: e.target.value } })}>
                {Object.entries(SHAPES).map(([k, s]) => (
                  <option key={k} value={k}>
                    {s.nom}
                  </option>
                ))}
              </Field>
              <div className="pt-6">
                <Toggle checked={form.art.glow} onChange={(v) => set({ art: { ...form.art, glow: v } })} label="Lumineuse" hint="Pour les lampes" />
              </div>
            </div>
          ) : (
            <Field label="Figure" as="select" value={form.art.figure} onChange={(e) => set({ art: { ...form.art, figure: e.target.value } })}>
              {Object.entries(FIGURE_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Fond de la carte" value={form.bg} onChange={(v) => set({ bg: v })} />
            <div className="pt-6">
              <Toggle checked={form.dark} onChange={(v) => set({ dark: v })} label="Fond sombre" hint="Texte clair" />
            </div>
          </div>
        </section>

        {/* Specs */}
        <section>
          <div className="flex items-center justify-between">
            <p className="mono text-ash">Caractéristiques</p>
            <button
              type="button"
              disabled={form.specs.length >= 10}
              onClick={() => set({ specs: [...form.specs, { k: '', v: '' }] })}
              className="text-[14px] underline underline-offset-4 hover:text-ember disabled:opacity-30"
            >
              + Ajouter
            </button>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {form.specs.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  value={s.k}
                  placeholder="hauteur"
                  onChange={(e) => set({ specs: form.specs.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)) })}
                  className="h-12 w-40 rounded-2xl border border-ink/15 bg-paper px-4 font-mono text-[13px] outline-none focus:border-ink"
                />
                <input
                  value={s.v}
                  placeholder="22 cm"
                  onChange={(e) => set({ specs: form.specs.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)) })}
                  className="h-12 flex-1 rounded-2xl border border-ink/15 bg-paper px-4 text-[15px] outline-none focus:border-ink"
                />
                <IconButton label="Retirer" onClick={() => set({ specs: form.specs.filter((_, j) => j !== i) })}>
                  ×
                </IconButton>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-2 sm:grid-cols-2">
          <Toggle checked={form.actif} onChange={(v) => set({ actif: v })} label="Visible sur le site" hint="Masquée = brouillon" />
          <Toggle checked={form.featured} onChange={(v) => set({ featured: v })} label="En vedette" hint="Proposée en suggestion" />
        </section>
      </form>
    </Drawer>
  );
}

// ── Pieces view ─────────────────────────────────────────────────────────────

export function PiecesView() {
  const { data, error, commit } = useAdminCatalogue();
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);

  if (error) return <p className="text-ember">{error}</p>;
  if (!data) return <PrintDots />;

  const { products, collections } = data;
  const collName = (slug) => collections.find((c) => c.slug === slug)?.nom || slug;
  const list = products.filter(
    (p) => (!filter || p.collection === filter) && (!q.trim() || p.nom.toLowerCase().includes(q.trim().toLowerCase()))
  );

  const onSaved = (saved, created) => {
    commit({ products: created ? [...products, saved] : products.map((p) => (p.id === saved.id ? saved : p)) });
  };

  const move = async (p, dir) => {
    const i = products.findIndex((x) => x.id === p.id);
    const j = i + dir;
    if (j < 0 || j >= products.length) return;
    const next = [...products];
    [next[i], next[j]] = [next[j], next[i]];
    commit({ products: next });
    try {
      await api.admin.reorderPieces(next.map((x) => x.id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleVisible = async (p) => {
    try {
      const saved = await api.admin.updatePiece(p.id, { actif: !p.actif });
      commit({ products: products.map((x) => (x.id === saved.id ? saved : x)) });
      toast(saved.actif ? `${saved.nom} est visible` : `${saved.nom} est masquée`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">
          {[{ slug: '', nom: 'Toutes' }, ...collections].map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setFilter(c.slug)}
              className={`h-9 rounded-full border px-4 text-[14px] transition-colors ${filter === c.slug ? 'border-ink bg-ink text-bone' : 'border-ink/15 hover:border-ink'}`}
            >
              {c.nom}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chercher une pièce…"
            className="h-11 w-full rounded-full border border-ink/15 bg-paper px-5 text-[15px] outline-none focus:border-ink sm:w-60"
          />
          <button
            type="button"
            disabled={!collections.length}
            onClick={() => setEditing(emptyPiece(filter || collections[0]?.slug))}
            className="h-11 shrink-0 rounded-full bg-ember px-5 font-semibold text-ink disabled:opacity-40"
          >
            + Nouvelle pièce
          </button>
        </div>
      </div>

      <p className="mono mb-3 mt-6 text-ash">
        {list.length} pièce(s) · {products.filter((p) => !p.actif).length} masquée(s)
      </p>
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {list.map((p) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: EASE }}
              className={`grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-[22px] bg-paper p-3 pe-4 sm:grid-cols-[64px_1fr_160px_110px_auto] ${p.actif ? '' : 'opacity-60'}`}
            >
              <button type="button" onClick={() => setEditing(p)} className="h-20 w-16 overflow-hidden rounded-xl" style={{ background: p.bg }} aria-label={`Modifier ${p.nom}`}>
                <ProductArt product={p} />
              </button>
              <button type="button" onClick={() => setEditing(p)} className="min-w-0 text-start">
                <span className="block truncate font-semibold">{p.nom}</span>
                <span className="mono flex flex-wrap gap-x-2 text-[10px] text-ash">
                  <span>{p.couleurs.length} couleur(s)</span>
                  {p.photo ? <span className="text-ink">· photo</span> : null}
                  {p.featured ? <span className="text-ember">· vedette</span> : null}
                  {!p.actif ? <span>· masquée</span> : null}
                </span>
              </button>
              <span className="hidden text-[14px] text-ash sm:block">{collName(p.collection)}</span>
              <span className="hidden font-mono text-[14px] sm:block">{formatDA(p.prix)}</span>
              <span className="flex items-center gap-1.5">
                <IconButton label={p.actif ? 'Masquer' : 'Afficher'} onClick={() => toggleVisible(p)}>
                  {p.actif ? '◉' : '○'}
                </IconButton>
                <span className="hidden gap-1.5 sm:flex">
                  <IconButton label="Monter" disabled={filter || q} onClick={() => move(p, -1)}>
                    ↑
                  </IconButton>
                  <IconButton label="Descendre" disabled={filter || q} onClick={() => move(p, 1)}>
                    ↓
                  </IconButton>
                </span>
                <button type="button" onClick={() => setEditing(p)} className="h-9 rounded-full bg-ink px-4 text-[13px] font-medium text-bone">
                  Modifier
                </button>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {!list.length ? <p className="rounded-[22px] border border-dashed border-ink/15 px-6 py-16 text-center text-ash">Aucune pièce ici.</p> : null}
      {filter || q ? <p className="mono mt-3 text-ash">L’ordre se change depuis « Toutes », sans recherche.</p> : null}

      {editing ? (
        <PieceEditor
          key={editing.id || 'new'}
          piece={editing}
          collections={collections}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
          onDeleted={(id) => commit({ products: products.filter((p) => p.id !== id) })}
        />
      ) : null}
    </div>
  );
}

// ── Collections view ────────────────────────────────────────────────────────

const emptyCollection = { nom: '', accroche: '', tone: '#E9DFC9', dark: false, nouveau: false, hero: '' };

function CollectionEditor({ coll, collections, products, onClose, onSaved, onDeleted }) {
  const creating = !coll.id;
  const [form, setForm] = useState(coll);
  const [saving, setSaving] = useState(false);
  const [moveTo, setMoveTo] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const pieces = products.filter((p) => p.collection === coll.slug);
  const others = collections.filter((c) => c.slug !== coll.slug);
  const hero = pieces.find((p) => p.slug === form.hero) || pieces[0];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim()) return toast.error('Donnez un nom à la collection');
    setSaving(true);
    try {
      const body = { nom: form.nom, accroche: form.accroche, tone: form.tone, dark: form.dark, nouveau: form.nouveau, hero: form.hero };
      const saved = creating ? await api.admin.createCollection(body) : await api.admin.updateCollection(coll.id, body);
      onSaved(saved, creating);
      toast(creating ? `Collection ${saved.nom} créée ✓` : `${saved.nom} enregistrée ✓`);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  const remove = async () => {
    try {
      const res = await api.admin.deleteCollection(coll.id, pieces.length ? moveTo : undefined);
      onDeleted(coll, pieces.length ? moveTo : null);
      toast(res.moved ? `Supprimée, ${res.moved} pièce(s) déplacée(s)` : 'Collection supprimée');
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={creating ? 'Nouvelle collection' : form.nom || 'Collection'}
      footer={
        <>
          {!creating ? <DeleteButton onConfirm={remove} disabled={pieces.length > 0 && !moveTo} /> : <span />}
          <SaveButton saving={saving}>{creating ? 'Créer la collection' : 'Enregistrer'}</SaveButton>
        </>
      }
    >
      <form id="catalogue-form" onSubmit={submit} className="flex flex-col gap-6">
        <div className={`relative flex h-48 items-end overflow-hidden rounded-[22px] p-5 ${form.dark ? 'text-bone' : 'text-ink'}`} style={{ background: form.tone }}>
          <div className={`absolute inset-0 ${form.dark ? 'layer-lines-light' : 'layer-lines'}`} />
          {hero ? (
            <div className="absolute inset-y-0 right-0 w-1/2">
              <ProductArt product={hero} />
            </div>
          ) : null}
          <div className="relative max-w-[55%]">
            {form.nouveau ? <span className="mono mb-2 inline-block rounded-full bg-ember px-2 py-0.5 text-[10px] text-ink">Nouveau</span> : null}
            <p className="display text-[40px]">{form.nom || 'Nom'}</p>
            <p className="text-[13px] opacity-75">{form.accroche || 'Accroche de la collection'}</p>
          </div>
        </div>

        <Field label="Nom" value={form.nom} onChange={(e) => set({ nom: e.target.value })} placeholder="Vases & pots" />
        <Field label="Accroche" as="textarea" rows={2} value={form.accroche} onChange={(e) => set({ accroche: e.target.value })} placeholder="Une phrase qui donne envie." />
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Couleur du panneau" value={form.tone} onChange={(v) => set({ tone: v })} />
          <div className="sm:pt-6">
            <Toggle checked={form.dark} onChange={(v) => set({ dark: v })} label="Panneau sombre" hint="Texte clair" />
          </div>
        </div>
        {!creating ? (
          <Field label="Pièce mise en avant" as="select" value={form.hero} onChange={(e) => set({ hero: e.target.value })}>
            <option value="">Automatique (la première)</option>
            {pieces.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.nom}
              </option>
            ))}
          </Field>
        ) : null}
        <Toggle checked={form.nouveau} onChange={(v) => set({ nouveau: v })} label="Nouvelle collection" hint="Badge « Nouveau » et mise en avant sur l’accueil" />

        {!creating && pieces.length ? (
          <div className="rounded-[22px] border border-dashed border-ink/20 p-4">
            <p className="text-[15px] font-medium">Supprimer cette collection ?</p>
            <p className="mt-1 text-[13px] text-ash">Elle contient {pieces.length} pièce(s). Choisissez où les déplacer avant de la supprimer.</p>
            <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className="mt-3 h-11 w-full rounded-full border border-ink/15 bg-paper px-4 text-[14px]">
              <option value="">Déplacer les pièces vers…</option>
              {others.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </form>
    </Drawer>
  );
}

export function CollectionsView() {
  const { data, error, commit } = useAdminCatalogue();
  const [editing, setEditing] = useState(null);

  if (error) return <p className="text-ember">{error}</p>;
  if (!data) return <PrintDots />;
  const { collections, products } = data;

  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= collections.length) return;
    const next = [...collections];
    [next[i], next[j]] = [next[j], next[i]];
    commit({ collections: next });
    try {
      await api.admin.reorderCollections(next.map((c) => c.id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="mono text-ash">{collections.length} collection(s) · l’ordre est celui du site</p>
        <button type="button" onClick={() => setEditing(emptyCollection)} className="h-11 rounded-full bg-ember px-5 font-semibold text-ink">
          + Nouvelle collection
        </button>
      </div>
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {collections.map((c, i) => {
            const pieces = products.filter((p) => p.collection === c.slug);
            const hero = pieces.find((p) => p.slug === c.hero) || pieces[0];
            const dark = c.dark;
            return (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: EASE }}
                className={`relative flex h-56 flex-col justify-between overflow-hidden rounded-[24px] p-5 ${dark ? 'text-bone' : 'text-ink'}`}
                style={{ background: c.tone }}
              >
                <div className={`absolute inset-0 ${dark ? 'layer-lines-light' : 'layer-lines'}`} />
                {hero ? (
                  <div className="absolute inset-y-0 right-0 w-[45%]">
                    <ProductArt product={hero} />
                  </div>
                ) : null}
                <div className="relative flex items-center gap-2">
                  <span className="mono opacity-70">{String(i + 1).padStart(2, '0')}</span>
                  <span className="mono rounded-full border border-current/25 px-2.5 py-0.5 text-[10px] opacity-80">{pieces.length} pièces</span>
                  {c.nouveau ? <span className="mono rounded-full bg-ember px-2.5 py-0.5 text-[10px] text-ink">Nouveau</span> : null}
                </div>
                <div className="relative max-w-[58%]">
                  <p className="display text-[36px]">{c.nom}</p>
                  <p className="line-clamp-2 text-[13px] opacity-75">{c.accroche}</p>
                </div>
                <div className="relative flex gap-1.5">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter" className="h-9 w-9 rounded-full bg-paper/80 text-ink disabled:opacity-30">
                    ↑
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === collections.length - 1} aria-label="Descendre" className="h-9 w-9 rounded-full bg-paper/80 text-ink disabled:opacity-30">
                    ↓
                  </button>
                  <button type="button" onClick={() => setEditing(c)} className="h-9 rounded-full bg-ink px-4 text-[13px] font-medium text-bone">
                    Modifier
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {editing ? (
        <CollectionEditor
          key={editing.id || 'new'}
          coll={editing}
          collections={collections}
          products={products}
          onClose={() => setEditing(null)}
          onSaved={(saved, created) =>
            commit({ collections: created ? [...collections, saved] : collections.map((c) => (c.id === saved.id ? saved : c)) })
          }
          onDeleted={(gone, moveTo) =>
            commit({
              collections: collections.filter((c) => c.id !== gone.id),
              products: moveTo ? products.map((p) => (p.collection === gone.slug ? { ...p, collection: moveTo } : p)) : products,
            })
          }
        />
      ) : null}
    </div>
  );
}
