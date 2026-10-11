import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCatalogue } from '../lib/catalogue';
import { formatDA } from '../config';
import { EASE } from '../lib/motion';
import ProductArt from '../components/ProductArt';
import { PrintDots, STATUTS, StatusPill, Tabs, formatDate } from '../components/AccountUI';
import { CollectionsView, PiecesView } from './AdminCatalogue';

/**
 * The shop's back office: what needs attention, every demande with its
 * status, the catalogue (pieces and collections, see AdminCatalogue.jsx) and
 * the customer list.
 */

function useLoad(fn, deps) {
  const [state, setState] = useState({ data: null, error: '', loading: true });
  const reload = useCallback(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true }));
    fn(ctrl.signal)
      .then((data) => setState({ data, error: '', loading: false }))
      .catch((err) => err.name !== 'AbortError' && setState({ data: null, error: err.message, loading: false }));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => reload(), [reload]);
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) };
}

function Stat({ label, value, accent, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: i * 0.07, ease: EASE }}
      className={`rounded-[24px] p-6 ${accent ? 'bg-ember text-ink' : 'bg-paper'}`}
    >
      <p className={`mono ${accent ? 'text-ink/70' : 'text-ash'}`}>{label}</p>
      <p className="display mt-6 text-[clamp(40px,4vw,64px)] tracking-[-0.05em]">{value}</p>
    </motion.div>
  );
}

function Overview({ go }) {
  const { data, error } = useLoad((s) => api.admin.overview(s), []);
  if (error) return <p className="text-ember">{error}</p>;
  if (!data) return <PrintDots />;
  const totalDemandes = Object.values(data.statuts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat i={0} accent label="À traiter" value={data.statuts.NOUVELLE} />
        <Stat i={1} label="Clients" value={data.clients} />
        <Stat i={2} label="Nouveaux · 30 j" value={`+${data.nouveauxClients}`} />
        <Stat i={3} label="Confirmé · 30 j" value={formatDA(data.chiffre30j)} />
      </div>

      <div className="rounded-[24px] bg-paper p-6">
        <div className="flex items-baseline justify-between">
          <p className="mono text-ash">Demandes par statut</p>
          <p className="mono text-ash">{totalDemandes} au total</p>
        </div>
        <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-ink/5">
          {Object.entries(data.statuts).map(([s, n]) =>
            n ? (
              <motion.div
                key={s}
                title={`${STATUTS[s].label}: ${n}`}
                initial={{ width: 0 }}
                animate={{ width: `${(n / totalDemandes) * 100}%` }}
                transition={{ duration: 0.9, ease: EASE }}
                style={{ background: STATUTS[s].color }}
                className="h-full border-e-2 border-paper last:border-0"
              />
            ) : null
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(data.statuts).map(([s, n]) => (
            <button key={s} type="button" onClick={() => go('demandes', s)} className="flex items-center gap-2 text-[14px] hover:text-ember">
              <span className="h-2 w-2 rounded-full" style={{ background: STATUTS[s].color }} />
              {STATUTS[s].label} <span className="font-mono text-ash">{n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[24px] bg-paper p-6">
          <div className="flex items-center justify-between">
            <p className="mono text-ash">Dernières demandes</p>
            <button type="button" onClick={() => go('demandes')} className="text-[14px] underline underline-offset-4 hover:text-ember">
              Tout voir
            </button>
          </div>
          {data.recentes.length ? (
            <ul className="mt-4 divide-y divide-ink/10">
              {data.recentes.map((d) => (
                <li key={d._id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-mono text-[14px]">{d.numero}</p>
                    <p className="text-[14px] text-ash">{d.userId?.nom || 'Client supprimé'}</p>
                  </div>
                  <StatusPill statut={d.statut} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-ash">Aucune demande pour l’instant.</p>
          )}
        </div>
        <div className="rounded-[24px] bg-ink p-6 text-bone">
          <p className="mono text-smoke">Pièces les plus demandées</p>
          {data.topPieces.length ? (
            <ol className="mt-4 flex flex-col gap-3">
              {data.topPieces.map((t, i) => {
                const max = data.topPieces[0].qte;
                return (
                  <li key={t._id}>
                    <div className="flex justify-between text-[15px]">
                      <span>
                        <span className="font-mono text-smoke">0{i + 1}</span> {t.nom}
                      </span>
                      <span className="font-mono">{t.qte}</span>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-bone/10">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(t.qte / max) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.08, ease: EASE }} className="h-full rounded-full bg-ember" />
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-6 text-smoke">Les statistiques arrivent avec les premières demandes.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DemandeRow({ d, onChange }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(d.noteInterne || '');
  const [saving, setSaving] = useState(false);
  const { productBySlug } = useCatalogue();
  const u = d.userId;

  const update = async (body, msg) => {
    setSaving(true);
    try {
      onChange(await api.admin.updateDemande(d._id, body));
      toast(msg);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.li layout className="overflow-hidden rounded-[22px] bg-paper">
      <button type="button" onClick={() => setOpen((o) => !o)} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 p-5 text-start sm:grid-cols-[150px_1fr_150px_120px_24px]">
        <span className="font-mono text-[14px]">{d.numero}</span>
        <span className="hidden sm:block">
          <span className="block font-semibold">{u?.nom || 'Client supprimé'}</span>
          <span className="mono text-[10px] text-ash">
            {u?.telephone} {d.wilaya ? `· ${d.wilaya}` : ''}
          </span>
        </span>
        <span className="hidden sm:block">
          <StatusPill statut={d.statut} />
        </span>
        <span className="mono hidden text-ash sm:block">{formatDate(d.createdAt)}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} className="text-xl leading-none">
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            <div className="grid gap-6 border-t border-ink/10 p-5 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <p className="mono text-ash sm:hidden">
                  {u?.nom} · {u?.telephone}
                </p>
                <ul className="flex flex-col gap-2">
                  {d.lignes.map((l) => {
                    const p = productBySlug(l.slug);
                    return (
                      <li key={`${l.slug}-${l.couleur}`} className="flex items-center gap-3 rounded-2xl bg-bone p-2 pe-4">
                        <div className="h-14 w-12 overflow-hidden rounded-xl" style={{ background: p?.bg || '#e6e1d8' }}>
                          {p ? <ProductArt product={p} color={p.couleurs.find((c) => c.nom === l.couleur)?.hex} /> : null}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {l.qte} × {l.nom}
                          </p>
                          <p className="mono text-[10px] text-ash">{l.couleur}</p>
                        </div>
                        <span className="font-mono text-[14px]">{formatDA(l.prix * l.qte)}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-end font-mono">Total {formatDA(d.total)}</p>
                {d.note ? <p className="mt-3 rounded-2xl bg-lemon/30 p-3 text-[14px]">Note client : {d.note}</p> : null}
                {u?.email ? <p className="mono mt-3 text-ash">{u.email}</p> : null}
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mono text-ash">Statut</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(STATUTS).map(([s, meta]) => (
                      <button
                        key={s}
                        type="button"
                        disabled={saving || s === d.statut}
                        onClick={() => update({ statut: s }, `${d.numero} → ${meta.label}`)}
                        className={`flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] transition-colors ${
                          s === d.statut ? 'border-ink bg-ink text-bone' : 'border-ink/15 hover:border-ink'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                        {meta.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="mono text-ash">Note interne</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Délai annoncé, couleur spéciale…"
                    className="mt-2 w-full rounded-2xl border border-ink/15 bg-bone p-3 text-[15px] outline-none focus:border-ink"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving || note === (d.noteInterne || '')}
                  onClick={() => update({ noteInterne: note }, 'Note enregistrée')}
                  className="h-11 self-start rounded-full bg-ink px-5 text-[14px] font-medium text-bone disabled:opacity-40"
                >
                  Enregistrer la note
                </button>
                <div>
                  <p className="mono text-ash">Historique</p>
                  <ol className="mt-2 flex flex-col gap-1 text-[13px]">
                    {d.historique.map((h, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span>{STATUTS[h.statut]?.label}</span>
                        <span className="font-mono text-ash">
                          {formatDate(h.date)} {h.par ? `· ${h.par}` : ''}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-full border border-ink/15 bg-paper px-5 text-[15px] outline-none focus:border-ink sm:w-72"
    />
  );
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function Pager({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="h-10 rounded-full border border-ink/15 px-4 disabled:opacity-30">
        ←
      </button>
      <span className="font-mono text-[13px]">
        {page} / {pages}
      </span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="h-10 rounded-full border border-ink/15 px-4 disabled:opacity-30">
        →
      </button>
    </div>
  );
}

function DemandesView({ initialStatut }) {
  const [statut, setStatut] = useState(initialStatut || '');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, error, setData } = useLoad((s) => api.admin.demandes({ statut, q: dq, page }, s), [statut, dq, page]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">
          {[['', 'Toutes'], ...Object.entries(STATUTS).map(([k, v]) => [k, v.label])].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setStatut(k);
                setPage(1);
              }}
              className={`h-9 rounded-full border px-4 text-[14px] transition-colors ${statut === k ? 'border-ink bg-ink text-bone' : 'border-ink/15 hover:border-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <SearchBox
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="N°, nom, téléphone…"
        />
      </div>
      <div className="mt-6">
        {error ? (
          <p className="text-ember">{error}</p>
        ) : !data ? (
          <PrintDots />
        ) : !data.items.length ? (
          <p className="rounded-[22px] border border-dashed border-ink/15 px-6 py-16 text-center text-ash">Aucune demande ici.</p>
        ) : (
          <>
            <p className="mono mb-3 text-ash">{data.total} demande(s)</p>
            <ul className="flex flex-col gap-2">
              {data.items.map((d) => (
                <DemandeRow
                  key={d._id}
                  d={d}
                  onChange={(nd) => setData({ ...data, items: data.items.map((x) => (x._id === nd._id ? nd : x)) })}
                />
              ))}
            </ul>
            <Pager page={data.page} pages={data.pages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

function ClientsView() {
  const { isSuperAdmin, user: me } = useAuth();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, error, setData } = useLoad((s) => api.admin.users({ q: dq, role, page }, s), [dq, role, page]);

  const changeRole = async (u, next) => {
    try {
      const updated = await api.admin.setRole(u.id, next);
      setData({ ...data, items: data.items.map((x) => (x.id === u.id ? { ...x, role: updated.role } : x)) });
      toast(`${u.nom} est maintenant ${next === 'ADMIN' ? 'admin' : 'client'}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">
          {[
            ['', 'Tous'],
            ['CLIENT', 'Clients'],
            ['ADMIN', 'Admins'],
            ['SUPER_ADMIN', 'Super admin'],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setRole(k);
                setPage(1);
              }}
              className={`h-9 rounded-full border px-4 text-[14px] transition-colors ${role === k ? 'border-ink bg-ink text-bone' : 'border-ink/15 hover:border-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <SearchBox
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Nom, téléphone, email…"
        />
      </div>
      <div className="mt-6">
        {error ? (
          <p className="text-ember">{error}</p>
        ) : !data ? (
          <PrintDots />
        ) : !data.items.length ? (
          <p className="rounded-[22px] border border-dashed border-ink/15 px-6 py-16 text-center text-ash">Personne pour l’instant.</p>
        ) : (
          <>
            <p className="mono mb-3 text-ash">{data.total} compte(s)</p>
            <div className="overflow-x-auto rounded-[22px] bg-paper">
              <table className="w-full min-w-[720px] text-start text-[15px]">
                <thead>
                  <tr className="mono border-b border-ink/10 text-start text-ash">
                    <th className="p-4 text-start font-normal">Nom</th>
                    <th className="p-4 text-start font-normal">Contact</th>
                    <th className="p-4 text-start font-normal">Wilaya</th>
                    <th className="p-4 text-start font-normal">Demandes</th>
                    <th className="p-4 text-start font-normal">Inscrit</th>
                    <th className="p-4 text-start font-normal">Rôle</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-ink/5 last:border-0"
                    >
                      <td className="p-4 font-semibold">{u.nom}</td>
                      <td className="p-4">
                        <span className="block font-mono text-[13px]">{u.telephone}</span>
                        <span className="text-[13px] text-ash">{u.email}</span>
                      </td>
                      <td className="p-4 text-ash">{u.wilaya || '—'}</td>
                      <td className="p-4 font-mono">{u.demandes}</td>
                      <td className="p-4 font-mono text-[13px] text-ash">{formatDate(u.createdAt)}</td>
                      <td className="p-4">
                        {isSuperAdmin && u.role !== 'SUPER_ADMIN' && u.id !== me.id ? (
                          <select
                            value={u.role}
                            onChange={(e) => changeRole(u, e.target.value)}
                            className="h-9 rounded-full border border-ink/15 bg-bone px-3 text-[13px]"
                          >
                            <option value="CLIENT">Client</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        ) : (
                          <span className={`mono rounded-full px-2.5 py-1 text-[10px] ${u.role === 'CLIENT' ? 'bg-bone' : 'bg-ember text-ink'}`}>
                            {u.role === 'SUPER_ADMIN' ? 'Super admin' : u.role === 'ADMIN' ? 'Admin' : 'Client'}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} pages={data.pages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = ['apercu', 'demandes', 'pieces', 'collections', 'clients'].includes(params.get('vue')) ? params.get('vue') : 'apercu';
  const statut = params.get('statut') || '';
  const go = (vue, s) => setParams(s ? { vue, statut: s } : { vue }, { replace: true });

  return (
    <section className="mx-auto min-h-screen max-w-[1500px] px-5 pb-24 pt-32 sm:px-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="mono flex items-center gap-2 text-ash">
            <span className="h-2 w-2 rounded-full bg-ember ember" /> Admin · {user.nom} · {user.role === 'SUPER_ADMIN' ? 'super admin' : 'admin'}
          </p>
          <h1 className="display mt-4 text-[clamp(52px,7vw,112px)]">
            L’atelier, <span className="serif-i font-normal">en coulisses.</span>
          </h1>
        </div>
        <Link to="/" className="mono self-start text-ash hover:text-ember lg:self-auto">
          ← Retour au site
        </Link>
      </div>

      <div className="mt-10">
        <Tabs
          id="admin"
          value={tab}
          onChange={(v) => go(v)}
          tabs={[
            { id: 'apercu', label: 'Aperçu' },
            { id: 'demandes', label: 'Demandes' },
            { id: 'pieces', label: 'Pièces' },
            { id: 'collections', label: 'Collections' },
            { id: 'clients', label: 'Clients' },
          ]}
        />
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div key={tab + statut} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease: EASE }}>
            {tab === 'apercu' ? (
              <Overview go={go} />
            ) : tab === 'demandes' ? (
              <DemandesView initialStatut={statut} />
            ) : tab === 'pieces' ? (
              <PiecesView />
            ) : tab === 'collections' ? (
              <CollectionsView />
            ) : (
              <ClientsView />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
