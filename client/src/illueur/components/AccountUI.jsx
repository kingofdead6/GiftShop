import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { EASE } from '../lib/motion';

/**
 * Small pieces shared by the login, account and admin pages.
 */

export const STATUTS = {
  NOUVELLE: { label: 'Nouvelle', color: '#ff4f1a' },
  CONFIRMEE: { label: 'Confirmée', color: '#2f6b4f' },
  EN_IMPRESSION: { label: 'En impression', color: '#c9a34e' },
  EXPEDIEE: { label: 'Expédiée', color: '#4a6fa5' },
  LIVREE: { label: 'Livrée', color: '#131211' },
  ANNULEE: { label: 'Annulée', color: '#a59f95' },
};

/** The happy path, in order. ANNULEE sits outside it. */
export const PARCOURS = ['NOUVELLE', 'CONFIRMEE', 'EN_IMPRESSION', 'EXPEDIEE', 'LIVREE'];

export function StatusPill({ statut }) {
  const s = STATUTS[statut] || STATUTS.NOUVELLE;
  return (
    <span className="mono inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-paper px-2.5 py-1 text-[10px]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' });

export function Field({ label, hint, error, as = 'input', className = '', children, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = props.type === 'password';
  const Tag = as;
  return (
    <label className={`block ${className}`}>
      <span className="mono flex justify-between text-ash">
        {label}
        {hint ? <span className="normal-case tracking-normal opacity-70">{hint}</span> : null}
      </span>
      <span className="relative mt-2 block">
        <Tag
          {...props}
          type={isPassword && show ? 'text' : props.type}
          aria-invalid={error ? 'true' : undefined}
          className={`h-14 w-full rounded-2xl border bg-paper px-4 text-[16px] outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-ink/30 focus:border-ink focus:shadow-[0_0_0_4px_rgba(255,79,26,0.15)] ${
            error ? 'border-ember' : 'border-ink/15'
          } ${as === 'select' ? 'appearance-none' : ''} ${isPassword ? 'pe-20' : ''}`}
        >
          {children}
        </Tag>
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="mono absolute inset-y-0 end-2 my-2 rounded-xl px-3 text-[10px] text-ash hover:text-ink"
          >
            {show ? 'Cacher' : 'Voir'}
          </button>
        ) : null}
        {as === 'select' ? <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-ash">↓</span> : null}
      </span>
      {error ? <span className="mt-1.5 block text-[13px] text-ember">{error}</span> : null}
    </label>
  );
}

export function SubmitButton({ loading, children, className = '' }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-ink font-semibold text-bone disabled:opacity-70 ${className}`}
    >
      <span className="absolute inset-0 origin-bottom scale-y-0 bg-ember transition-transform duration-500 ease-out-expo group-hover:scale-y-100" />
      <span className="relative flex items-center gap-3 transition-colors group-hover:text-ink">
        {loading ? <PrintDots /> : null}
        {children}
      </span>
    </button>
  );
}

/** Three layers stacking: the loading indicator. */
export function PrintDots() {
  return (
    <span className="flex flex-col-reverse gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-[3px] rounded-full bg-current"
          style={{ width: 14 - i * 3 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

/** Heart toggle for a piece. Guests are sent to log in and brought back. */
export function WishlistButton({ slug, className = '', size = 40, tone = 'light' }) {
  const { user, toggleWishlist } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const saved = Boolean(user?.wishlist?.includes(slug));

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast('Connecte-toi pour garder tes favoris');
      navigate('/connexion', { state: { from: location.pathname } });
      return;
    }
    try {
      await toggleWishlist(slug);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      data-cursor=""
      style={{ width: size, height: size }}
      className={`flex items-center justify-center rounded-full backdrop-blur-md transition-colors ${
        tone === 'dark' ? 'bg-bone/10 text-bone hover:bg-bone/20' : 'bg-paper/70 text-ink hover:bg-paper'
      } ${className}`}
    >
      <motion.svg
        key={saved ? 'on' : 'off'}
        initial={{ scale: saved ? 0.4 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 14 }}
        width={size * 0.45}
        height={size * 0.45}
        viewBox="0 0 24 24"
        fill={saved ? '#ff4f1a' : 'none'}
        stroke={saved ? '#ff4f1a' : 'currentColor'}
        strokeWidth="2"
      >
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.2 1.7-2 3.2-3.2 5.3-3.2 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" />
      </motion.svg>
    </button>
  );
}

/** Route guard. Waits for the session check instead of flashing the login page. */
export function RequireAuth({ children, admin = false }) {
  const { loading, isLoggedIn, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PrintDots />
      </div>
    );
  }
  if (!isLoggedIn) return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  if (admin && !isAdmin) return <Navigate to="/compte" replace />;
  return children;
}

export function Tabs({ tabs, value, onChange, id }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className="relative h-11 rounded-full border border-ink/15 px-5 text-[15px] font-medium"
        >
          {value === t.id ? (
            <motion.span layoutId={`tab-${id}`} transition={{ duration: 0.5, ease: EASE }} className="absolute inset-0 rounded-full bg-ink" />
          ) : null}
          <span className={`relative flex items-center gap-2 transition-colors duration-300 ${value === t.id ? 'text-bone' : ''}`}>
            {t.label}
            {t.count !== undefined ? <span className="font-mono text-[11px] opacity-60">{t.count}</span> : null}
          </span>
        </button>
      ))}
    </div>
  );
}
