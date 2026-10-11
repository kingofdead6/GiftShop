import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import { SelectionProvider } from './illueur/lib/selection';
import { EASE_IN_OUT, scrollToTarget, useReducedMotion, useSmoothScroll } from './illueur/lib/motion';
import Navbar from './illueur/components/Navbar';
import Footer from './illueur/components/Footer';
import SelectionDrawer from './illueur/components/SelectionDrawer';
import { Cursor, Preloader } from './illueur/components/Chrome';

import Home from './illueur/pages/Home';
import Collection from './illueur/pages/Collection';
import Piece from './illueur/pages/Piece';
import NotFound from './illueur/pages/NotFound';

/**
 * Atelier illueur — storefront demo.
 *
 * Fully client-side: the catalogue lives in illueur/data/catalogue.js and
 * orders end in an Instagram DM, which is how the shop already works. The
 * Express/Mongo server in /server is not used by this storefront.
 */

const BARS = 7;

/**
 * Route change as a print: ink layers stack up from the bottom to cover the
 * old page, then lift away from the new one, bottom layer first.
 */
function Wipe() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80] flex flex-col">
      {Array.from({ length: BARS }, (_, i) => (
        <motion.div
          key={i}
          className="layer-lines-light w-full flex-1 bg-ink"
          variants={{
            initial: { scaleY: 1, originY: 0 },
            animate: { scaleY: 0, originY: 0, transition: { duration: 0.5, delay: 0.05 + (BARS - 1 - i) * 0.045, ease: EASE_IN_OUT } },
            exit: { scaleY: 1, originY: 1, transition: { duration: 0.42, delay: (BARS - 1 - i) * 0.045, ease: EASE_IN_OUT } },
          }}
          style={{ marginTop: -1 }}
        />
      ))}
    </div>
  );
}

function Page({ children }) {
  const reduced = useReducedMotion();
  if (reduced) return children;
  return (
    <motion.div initial="initial" animate="animate" exit="exit">
      <Wipe />
      {children}
    </motion.div>
  );
}

function Shell() {
  const location = useLocation();
  useSmoothScroll();

  return (
    <>
      <Preloader />
      <Cursor />
      <Navbar />
      <AnimatePresence mode="wait" initial={false} onExitComplete={() => scrollToTarget(0, { immediate: true })}>
        <Page key={location.pathname}>
          <main className="min-h-screen">
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/collection/:slug" element={<Collection />} />
              <Route path="/piece/:slug" element={<Piece />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </Page>
      </AnimatePresence>
      <SelectionDrawer />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#131211',
            color: '#efebe3',
            borderRadius: '999px',
            fontSize: '14px',
            padding: '12px 20px',
          },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SelectionProvider>
        <Shell />
      </SelectionProvider>
    </BrowserRouter>
  );
}
