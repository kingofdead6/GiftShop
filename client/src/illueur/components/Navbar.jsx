import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { brand, instagramUrl } from '../config';
import { useSelection } from '../lib/selection';
import { useAuth } from '../lib/auth';
import { EASE, EASE_IN_OUT, lockScroll, printEase, scrollToTarget } from '../lib/motion';

export const NAV = [
  { id: 'pieces', label: 'Pièces' },
  { id: 'collections', label: 'Collections' },
  { id: 'atelier', label: 'Atelier' },
  { id: 'livraison', label: 'Livraison' },
];

/** Section links work from any page: off the home page they route home first. */
export function useSectionLink() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (id) => (e) => {
    e?.preventDefault();
    if (pathname === '/') scrollToTarget(id);
    else navigate(`/#${id}`);
  };
}

function Wordmark() {
  return (
    <Link to="/" className="group flex items-baseline gap-2" data-cursor="">
      <span className="display text-[26px] leading-none tracking-[-0.06em]">
        illueur<span className="text-ember">.</span>
      </span>
      <span className="mono hidden text-[10px] opacity-60 sm:inline">atelier ✦ dz</span>
    </Link>
  );
}

export default function Navbar() {
  const { count, setOpen, pulse } = useSelection();
  const { user, isAdmin } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const { scrollY } = useScroll();
  const go = useSectionLink();
  const { pathname } = useLocation();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > 240 && y > prev && !menu);
  });

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    lockScroll(menu);
    return () => lockScroll(false);
  }, [menu]);

  return (
    <>
      <motion.header
        animate={{ y: hidden ? -110 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
      >
        <nav className="mx-auto flex h-14 max-w-[1500px] items-center justify-between rounded-full border border-ink/10 bg-bone/80 pe-2 ps-5 text-ink shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <Wordmark />

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((l) => (
              <li key={l.id}>
                <a
                  href={`/#${l.id}`}
                  onClick={go(l.id)}
                  className="group relative block overflow-hidden rounded-full px-4 py-2 text-[15px] font-medium"
                >
                  <span className="block transition-transform duration-500 ease-out-expo group-hover:-translate-y-full">
                    {l.label}
                  </span>
                  <span className="serif-i absolute inset-0 flex translate-y-full items-center justify-center text-[18px] text-ember transition-transform duration-500 ease-out-expo group-hover:translate-y-0">
                    {l.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Link to="/admin" className="mono hidden h-10 items-center rounded-full border border-ink/15 px-3 transition-colors hover:border-ember hover:text-ember md:flex">
                Admin
              </Link>
            ) : null}
            <Link
              to={user ? '/compte' : '/connexion'}
              aria-label={user ? 'Mon compte' : 'Se connecter'}
              data-cursor={user ? 'Compte' : 'Login'}
              className="flex h-10 min-w-10 items-center justify-center rounded-full border border-ink/15 px-2 transition-colors hover:border-ink"
            >
              {user ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ember font-mono text-[12px] uppercase text-ink">
                  {user.nom.trim()[0]}
                </span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                </svg>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-medium text-bone transition-colors hover:bg-ember hover:text-ink"
            >
              <span className="hidden sm:inline">Ma sélection</span>
              <span className="sm:hidden">Sélection</span>
              <motion.span
                key={pulse}
                initial={{ scale: pulse ? 1.6 : 1 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 font-mono text-[11px] text-ink"
              >
                {count}
              </motion.span>
            </button>
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menu}
              onClick={() => setMenu((m) => !m)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full border border-ink/15 lg:hidden"
            >
              <motion.span animate={menu ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }} className="block h-[1.5px] w-4 bg-ink" />
              <motion.span animate={menu ? { rotate: -45, y: -3 } : { rotate: 0, y: 0 }} className="block h-[1.5px] w-4 bg-ink" />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menu ? (
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: EASE_IN_OUT }}
            className="layer-lines-light fixed inset-0 z-40 flex flex-col justify-between bg-ink px-6 pb-8 pt-28 text-bone lg:hidden"
          >
            <ul className="flex flex-col gap-1">
              {NAV.map((l, i) => (
                <li key={l.id} className="overflow-hidden">
                  <motion.a
                    href={`/#${l.id}`}
                    onClick={(e) => {
                      setMenu(false);
                      go(l.id)(e);
                    }}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.25 + i * 0.07, duration: 0.8, ease: EASE }}
                    className="display flex items-baseline gap-4 text-[17vw] leading-[0.95]"
                  >
                    <span className="mono text-[11px] text-smoke">0{i + 1}</span>
                    {l.label}
                  </motion.a>
                </li>
              ))}
            </ul>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.6, duration: 0.6, ease: printEase(6) } }}
              className="flex items-end justify-between"
            >
              <div className="flex flex-col gap-2">
                <Link to={user ? '/compte' : '/connexion'} className="mono text-bone">
                  {user ? 'Mon compte →' : 'Se connecter →'}
                </Link>
                {isAdmin ? (
                  <Link to="/admin" className="mono text-bone">
                    Admin →
                  </Link>
                ) : null}
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="mono text-ember">
                  @{brand.instagram} ↗
                </a>
              </div>
              <span className="mono text-smoke">Made in Algeria</span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
