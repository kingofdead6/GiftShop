import Figure from './Figures';
import PrintCanvas from './PrintCanvas';

/**
 * Whatever stands in for a product photo. A real photo wins when the product
 * has one; otherwise a procedural print (vases, lamps) or a low-poly figure.
 */
export default function ProductArt({ product, color, active = false, draggable = false, printOnView = false, className = '' }) {
  const hex = color || product.couleurs[0].hex;

  if (product.photo) {
    return (
      <img
        src={product.photo}
        alt={product.nom}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  if (product.art.kind === 'layers') {
    return (
      <PrintCanvas
        shape={product.art.shape}
        color={hex}
        glow={product.art.glow}
        spin={active}
        draggable={draggable}
        printOnView={printOnView}
        className={`h-full w-full ${className}`}
      />
    );
  }

  return (
    <div className={`h-full w-full p-[8%] ${className}`}>
      <Figure figure={product.art.figure} color={hex} className="h-full w-full" />
    </div>
  );
}
