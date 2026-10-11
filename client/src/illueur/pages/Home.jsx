import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../sections/Hero';
import { Atelier, Avis, Collections, Drop, Livraison, Manifesto, Marquee, Pieces, Prix } from '../sections/HomeSections';
import { scrollToTarget } from '../lib/motion';

export default function Home() {
  const { hash } = useLocation();
  // The preloader runs on the first visit of a session; the hero waits for it.
  const [introDelay] = useState(() => {
    try {
      return sessionStorage.getItem('illueur.loaded') ? 0.15 : 2.1;
    } catch {
      return 0.15;
    }
  });

  useEffect(() => {
    if (!hash) return undefined;
    const id = setTimeout(() => scrollToTarget(hash), 350);
    return () => clearTimeout(id);
  }, [hash]);

  return (
    <>
      <Hero introDelay={introDelay} />
      <Marquee />
      <Manifesto />
      <Drop />
      <Collections />
      <Pieces />
      <Atelier />
      <Prix />
      <Avis />
      <Livraison />
    </>
  );
}
