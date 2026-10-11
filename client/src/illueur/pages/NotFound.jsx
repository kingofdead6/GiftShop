import { Link } from 'react-router-dom';
import PrintCanvas from '../components/PrintCanvas';

/** A print that failed: the vase only got a third of the way up. */
export default function NotFound() {
  return (
    <section className="mx-auto grid min-h-[100svh] max-w-[1500px] items-center gap-10 px-5 pt-24 sm:px-8 lg:grid-cols-2">
      <div>
        <p className="mono text-ember">Erreur 404 · impression interrompue</p>
        <h1 className="display mt-6 text-[clamp(72px,12vw,200px)]">
          Raté<span className="serif-i font-normal">.</span>
        </h1>
        <p className="mt-6 max-w-md text-[19px] text-ash">Cette page n’existe pas, ou la bobine est tombée à court en plein milieu.</p>
        <Link to="/" className="mt-10 inline-flex h-14 items-center rounded-full bg-ink px-7 font-semibold text-bone hover:bg-ember hover:text-ink">
          Relancer depuis l’accueil
        </Link>
      </div>
      <div className="aspect-square overflow-hidden rounded-[28px] bg-ink">
        <FailedPrint />
      </div>
    </section>
  );
}

function FailedPrint() {
  return <PrintCanvas shape="kraft" color="#C49A6C" className="h-full w-full" tilt={0.3} printOnView stopAt={0.34} />;
}
