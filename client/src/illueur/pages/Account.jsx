import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { productBySlug, wilayas } from '../data/catalogue';
import { formatDA, instagramDmUrl, showPrices } from '../config';
import { EASE } from '../lib/motion';
import ProductCard from '../components/ProductCard';
import ProductArt from '../components/ProductArt';
import { RiseLines } from '../components/Chrome';
import { Field, PARCOURS, PrintDots, STATUTS, StatusPill, SubmitButton, Tabs, formatDate } from '../components/AccountUI';

/** Progress as print layers: one segment per step, filled up to the current one. */
function Tracker({ statut }) {
  if (statut === 'ANNULEE') return <p className="mono text-ash">Demande annulée</p>;
  const at = PARCOURS.indexOf(statut);
  return (
    <div>
      <div className="flex gap-1">
        {PARCOURS.map((s, i) => (
          <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              className="h-full origin-left rounded-full"
              style={{ background: i === at ? '#ff4f1a' : '#131211' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: i <= at ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.12, ease: EASE }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 hidden justify-between sm:flex">
        {PARCOURS.map((s, i) => (
          <span key={s} className={`mono text-[10px] ${i <= at ? 'text-ink' : 'text-ash/60'}`}>
            {STATUTS[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Demandes() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    api
      .myDemandes(ctrl.signal)
      .then(setList)
      .catch((err) => err.name !== 'AbortError' && setError(err.message));
    return () => ctrl.abort();
  }, []);

  if (error) return <p className="text-ember">{error}</p>;
  if (!list) return <PrintDots />;
  if (!list.length) {
    return (
      <Empty title="Aucune demande" text="Ajoute des pièces à ta sélection et envoie-la en DM : elle apparaîtra ici avec son suivi.">
        <Link to="/#pieces" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 font-medium text-bone">
          Voir les pièces
        </Link>
      </Empty>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {list.map((d, i) => (
        <motion.li
          key={d._id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
          className="rounded-[24px] bg-paper p-5 sm:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[15px] font-medium">{d.numero}</span>
              <StatusPill statut={d.statut} />
            </div>
            <span className="mono text-ash">{formatDate(d.createdAt)}</span>
          </div>
          <div className="mt-6">
            <Tracker statut={d.statut} />
          </div>
          <ul className="mt-6 flex flex-wrap gap-3">
            {d.lignes.map((l) => {
              const p = productBySlug(l.slug);
              return (
                <li key={`${l.slug}-${l.couleur}`} className="flex items-center gap-3 rounded-2xl bg-bone p-2 pe-4">
                  <div className="h-14 w-12 overflow-hidden rounded-xl" style={{ background: p?.bg || '#e6e1d8' }}>
                    {p ? <ProductArt product={p} color={p.couleurs.find((c) => c.nom === l.couleur)?.hex} /> : null}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold leading-tight">
                      {l.qte} × {l.nom}
                    </p>
                    <p className="mono text-[10px] text-ash">{l.couleur}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
            {showPrices ? <span className="font-mono text-[14px]">{formatDA(d.total)} + livraison</span> : <span />}
            <a href={instagramDmUrl} target="_blank" rel="noreferrer" className="text-[14px] underline decoration-ink/30 underline-offset-4 hover:decoration-ember">
              Une question sur {d.numero} ? DM ↗
            </a>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

function Favoris() {
  const { user } = useAuth();
  const items = (user.wishlist || []).map(productBySlug).filter(Boolean);
  if (!items.length) {
    return (
      <Empty title="Pas encore de favoris" text="Touche le cœur sur une pièce pour la garder ici.">
        <Link to="/#pieces" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 font-medium text-bone">
          Explorer
        </Link>
      </Empty>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p, i) => (
        <ProductCard key={p.slug} product={p} index={i} />
      ))}
    </div>
  );
}

function Profil() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: user.nom, email: user.email || '', wilaya: user.wilaya || '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setBusy('profil');
    try {
      await updateProfile(form);
      toast('Profil enregistré ✓');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    if (pwd.newPassword.length < 6) return toast.error('Au moins 6 caractères');
    setBusy('pwd');
    try {
      await api.changePassword(pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      toast('Mot de passe modifié ✓');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
    return undefined;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="flex flex-col gap-5 rounded-[24px] bg-paper p-6 sm:p-8">
        <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Mes informations</h3>
        <Field label="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <Field label="Téléphone" value={user.telephone} disabled hint="identifiant" />
        <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field label="Wilaya" as="select" value={form.wilaya} onChange={(e) => setForm({ ...form, wilaya: e.target.value })}>
          <option value="">Choisir…</option>
          {wilayas.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </Field>
        <SubmitButton loading={busy === 'profil'}>Enregistrer</SubmitButton>
      </form>

      <div className="flex flex-col gap-6">
        <form onSubmit={changePwd} className="flex flex-col gap-5 rounded-[24px] bg-paper p-6 sm:p-8">
          <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Mot de passe</h3>
          <Field label="Actuel" type="password" autoComplete="current-password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          <Field label="Nouveau" type="password" autoComplete="new-password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          <SubmitButton loading={busy === 'pwd'}>Changer le mot de passe</SubmitButton>
        </form>
        <button
          type="button"
          onClick={async () => {
            await logout();
            toast('À bientôt ✦');
            navigate('/');
          }}
          className="h-14 rounded-full border border-ink/15 font-medium transition-colors hover:border-ember hover:text-ember"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function Empty({ title, text, children }) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-dashed border-ink/15 px-6 py-20 text-center">
      <p className="display text-[48px] text-ink/15">{title}</p>
      <p className="mt-3 max-w-sm text-ash">{text}</p>
      {children}
    </div>
  );
}

export default function Account() {
  const { user, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = ['demandes', 'favoris', 'profil'].includes(params.get('tab')) ? params.get('tab') : 'demandes';
  const prenom = user.nom.split(' ')[0];

  return (
    <section className="mx-auto min-h-screen max-w-[1500px] px-5 pb-24 pt-32 sm:px-8 lg:pt-40">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="mono text-ash">
            Mon compte · membre depuis {user.createdAt ? formatDate(user.createdAt) : 'aujourd’hui'}
          </p>
          <h1 className="display mt-5 text-[clamp(56px,9vw,150px)]">
            <RiseLines animateNow delay={0.2} lines={[<span key="s">Salam, <span className="serif-i font-normal text-ember">{prenom}.</span></span>]} />
          </h1>
        </div>
        {isAdmin ? (
          <Link to="/admin" className="inline-flex h-12 items-center gap-2 self-start rounded-full bg-ember px-6 font-semibold text-ink lg:self-auto">
            Ouvrir l’admin →
          </Link>
        ) : null}
      </div>

      <div className="mt-10">
        <Tabs
          id="account"
          value={tab}
          onChange={(t) => setParams({ tab: t }, { replace: true })}
          tabs={[
            { id: 'demandes', label: 'Mes demandes' },
            { id: 'favoris', label: 'Favoris', count: user.wishlist?.length || 0 },
            { id: 'profil', label: 'Profil' },
          ]}
        />
      </div>

      <div className="mt-10">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease: EASE }}>
            {tab === 'demandes' ? <Demandes /> : tab === 'favoris' ? <Favoris /> : <Profil />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
