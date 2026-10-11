/**
 * The catalogue, kept on the client so the demo runs with no backend.
 *
 * `art` picks how a piece is drawn until real photos exist:
 *   { kind: 'layers', shape }  procedural print, see lib/layerRender.js
 *   { kind: 'figure', figure } low-poly SVG, see components/Figures.jsx
 *
 * To use a photo instead, add `photo: '/products/<slug>.jpg'` to the product
 * and drop the file in client/public/products. The photo wins over the art.
 *
 * Prices are placeholders (see showPrices in config.js).
 */

export const collections = [
  {
    slug: 'vases',
    nom: 'Vases & pots',
    accroche: 'Du papier froissé, un citron, un cactus. En PLA.',
    tone: '#E9DFC9',
    hero: 'kraft',
  },
  {
    slug: 'lampes',
    nom: 'Lampes',
    accroche: 'La lumière passe à travers chaque couche.',
    tone: '#1C1A17',
    hero: 'vague',
  },
  {
    slug: 'encens',
    nom: 'Porte-encens',
    accroche: 'Samurai, Meow, Alien, Moai. La nouvelle collection.',
    tone: '#D9E4D0',
    hero: 'moai',
    nouveau: true,
  },
  {
    slug: 'porte-lunettes',
    nom: 'Porte-lunettes',
    accroche: 'Des têtes low-poly qui gardent vos lunettes de soleil.',
    tone: '#F1C9B5',
    hero: 'gorille',
  },
  {
    slug: 'statement',
    nom: 'Pièces statement',
    accroche: 'Bustes grecs, Atlas porte-étagère, et un nœud pour vos bijoux.',
    tone: '#DCD8E8',
    hero: 'buste',
  },
];

const C = {
  kraft: { nom: 'Kraft', hex: '#C49A6C' },
  blanc: { nom: 'Blanc os', hex: '#EEE8DC' },
  noir: { nom: 'Noir mat', hex: '#2B2A28' },
  citron: { nom: 'Citron', hex: '#F2C230' },
  vert: { nom: 'Vert cactus', hex: '#4E8F4A' },
  sauge: { nom: 'Sauge', hex: '#7FA38A' },
  foret: { nom: 'Forêt', hex: '#2F6B4F' },
  terre: { nom: 'Terracotta', hex: '#C8653F' },
  rose: { nom: 'Rose poudré', hex: '#E7A7A2' },
  rouge: { nom: 'Rouge laque', hex: '#B3261E' },
  lilas: { nom: 'Lilas', hex: '#A99BD4' },
  marbre: { nom: 'Marbre', hex: '#E6E1D8' },
  or: { nom: 'Or', hex: '#C9A34E' },
  gris: { nom: 'Graphite', hex: '#4A4A4A' },
  alien: { nom: 'Vert alien', hex: '#8DC26F' },
  ambre: { nom: 'Ambre', hex: '#F08A3C' },
  lait: { nom: 'Lait', hex: '#F4E7D3' },
};

export const products = [
  // ── Vases ────────────────────────────────────────────────────────────────
  {
    slug: 'vase-sac-kraft',
    nom: 'Vase Sac Kraft',
    collection: 'vases',
    prix: 3200,
    couleurs: [C.kraft, C.blanc, C.noir],
    art: { kind: 'layers', shape: 'kraft' },
    bg: '#EFE4D2',
    resume: 'Un sac en papier froissé, figé en plastique végétal. Pour les fleurs séchées ou les pinceaux.',
    specs: { hauteur: '22 cm', impression: '7 h 40', couche: '0,2 mm', poids: '210 g' },
    featured: true,
  },
  {
    slug: 'vase-citron',
    nom: 'Vase Citron',
    collection: 'vases',
    prix: 2800,
    couleurs: [C.citron, C.vert, C.blanc],
    art: { kind: 'layers', shape: 'citron' },
    bg: '#FBF0C9',
    resume: "La peau d'un citron, pores compris, à l'échelle d'un vase. Une seule tige suffit.",
    specs: { hauteur: '16 cm', impression: '5 h 10', couche: '0,16 mm', poids: '140 g' },
    featured: true,
  },
  {
    slug: 'pot-cactus',
    nom: 'Pot Cactus',
    collection: 'vases',
    prix: 2400,
    couleurs: [C.vert, C.terre, C.blanc],
    art: { kind: 'layers', shape: 'cactus' },
    bg: '#DCEAD5',
    resume: 'Huit côtes, un sommet arrondi. Le pot a la forme de ce que vous devriez y planter.',
    specs: { hauteur: '14 cm', impression: '4 h 25', couche: '0,2 mm', poids: '160 g' },
  },
  {
    slug: 'vase-sculpte',
    nom: 'Vase Sculpté',
    collection: 'vases',
    prix: 3600,
    couleurs: [C.foret, C.sauge, C.noir],
    art: { kind: 'layers', shape: 'sculpte' },
    bg: '#D3E2D6',
    resume: 'Cinq lobes qui tournent en montant. Il change de profil à chaque pas autour de la table.',
    specs: { hauteur: '26 cm', impression: '9 h 05', couche: '0,2 mm', poids: '260 g' },
    featured: true,
  },

  // ── Lampes ───────────────────────────────────────────────────────────────
  {
    slug: 'lampe-vague',
    nom: 'Lampe Vague',
    collection: 'lampes',
    prix: 5900,
    couleurs: [C.lait, C.ambre, C.rose],
    art: { kind: 'layers', shape: 'vague', glow: true },
    bg: '#221F1B',
    dark: true,
    resume: 'Des ondulations fines comme une lithophanie. Éteinte, une sculpture. Allumée, une marée.',
    specs: { hauteur: '24 cm', impression: '11 h 30', couche: '0,12 mm', ampoule: 'LED E14 incluse' },
    featured: true,
  },
  {
    slug: 'lampe-flamme',
    nom: 'Lampe Flamme',
    collection: 'lampes',
    prix: 5400,
    couleurs: [C.ambre, C.lait, C.rouge],
    art: { kind: 'layers', shape: 'flamme', glow: true },
    bg: '#1B1815',
    dark: true,
    resume: 'Une flamme torsadée qui ne s’éteint pas. Parfaite sur une table de chevet.',
    specs: { hauteur: '28 cm', impression: '12 h 10', couche: '0,16 mm', ampoule: 'LED E14 incluse' },
  },

  // ── Porte-encens ─────────────────────────────────────────────────────────
  {
    slug: 'encens-samurai',
    nom: 'Samurai',
    collection: 'encens',
    prix: 2600,
    couleurs: [C.rouge, C.noir, C.blanc],
    art: { kind: 'figure', figure: 'samurai' },
    bg: '#F3D9D2',
    resume: 'Casque kabuto, croissant doré. Le bâton d’encens se plante derrière lui, la fumée fait le reste.',
    specs: { hauteur: '11 cm', impression: '3 h 50', couche: '0,12 mm', poids: '90 g' },
    featured: true,
  },
  {
    slug: 'encens-meow',
    nom: 'Meow',
    collection: 'encens',
    prix: 2200,
    couleurs: [C.noir, C.blanc, C.ambre],
    art: { kind: 'figure', figure: 'meow' },
    bg: '#E7E2F3',
    resume: 'Un chat assis, l’air de rien, pendant que votre salon sent le musc.',
    specs: { hauteur: '10 cm', impression: '3 h 05', couche: '0,12 mm', poids: '75 g' },
  },
  {
    slug: 'encens-alien',
    nom: 'Alien',
    collection: 'encens',
    prix: 2200,
    couleurs: [C.alien, C.gris, C.lilas],
    art: { kind: 'figure', figure: 'alien' },
    bg: '#DDEFD3',
    resume: 'Il a fait des années-lumière pour brûler votre encens. Soyez gentils.',
    specs: { hauteur: '10 cm', impression: '2 h 55', couche: '0,12 mm', poids: '70 g' },
  },
  {
    slug: 'encens-moai',
    nom: 'Moai',
    collection: 'encens',
    prix: 2400,
    couleurs: [C.gris, C.terre, C.blanc],
    art: { kind: 'figure', figure: 'moai' },
    bg: '#E4E1DA',
    resume: 'Une tête de l’île de Pâques, regard au loin. La fumée sort de son crâne.',
    specs: { hauteur: '12 cm', impression: '3 h 30', couche: '0,16 mm', poids: '95 g' },
    featured: true,
  },

  // ── Porte-lunettes ───────────────────────────────────────────────────────
  {
    slug: 'porte-lunettes-gorille',
    nom: 'Gorille',
    collection: 'porte-lunettes',
    prix: 3400,
    couleurs: [C.gris, C.blanc, C.or],
    art: { kind: 'figure', figure: 'gorille' },
    bg: '#F1C9B5',
    resume: 'Une tête low-poly qui porte vos lunettes de soleil mieux que vous.',
    specs: { hauteur: '17 cm', impression: '6 h 20', couche: '0,2 mm', poids: '180 g' },
    featured: true,
  },
  {
    slug: 'porte-lunettes-ours',
    nom: 'Ours',
    collection: 'porte-lunettes',
    prix: 3400,
    couleurs: [C.kraft, C.noir, C.blanc],
    art: { kind: 'figure', figure: 'ours' },
    bg: '#EADBC4',
    resume: 'Rond, calme, et toujours prêt pour la plage.',
    specs: { hauteur: '16 cm', impression: '6 h 00', couche: '0,2 mm', poids: '170 g' },
  },
  {
    slug: 'porte-lunettes-rhino',
    nom: 'Rhino',
    collection: 'porte-lunettes',
    prix: 3600,
    couleurs: [C.marbre, C.gris, C.sauge],
    art: { kind: 'figure', figure: 'rhino' },
    bg: '#D8E0E6',
    resume: 'La corne retient les lunettes. Il ne fallait pas plus d’excuse.',
    specs: { hauteur: '18 cm', impression: '6 h 45', couche: '0,2 mm', poids: '190 g' },
  },

  // ── Statement ────────────────────────────────────────────────────────────
  {
    slug: 'buste-grec',
    nom: 'Buste Grec',
    collection: 'statement',
    prix: 4800,
    couleurs: [C.marbre, C.noir, C.or],
    art: { kind: 'figure', figure: 'buste' },
    bg: '#DCD8E8',
    resume: 'Apollon en low-poly, sur son socle. L’Antiquité, imprimée cette semaine.',
    specs: { hauteur: '25 cm', impression: '10 h 15', couche: '0,16 mm', poids: '320 g' },
    featured: true,
  },
  {
    slug: 'etagere-atlas',
    nom: 'Étagère Atlas',
    collection: 'statement',
    prix: 6500,
    couleurs: [C.marbre, C.noir, C.terre],
    art: { kind: 'figure', figure: 'atlas' },
    bg: '#E8E2D6',
    resume: 'Le titan porte une étagère murale au lieu du ciel. Vis et chevilles fournies.',
    specs: { largeur: '32 cm', impression: '14 h 40', couche: '0,2 mm', charge: '3 kg max' },
  },
  {
    slug: 'vide-poche-noeud',
    nom: 'Vide-poche Nœud',
    collection: 'statement',
    prix: 1900,
    couleurs: [C.rose, C.blanc, C.lilas],
    art: { kind: 'figure', figure: 'noeud' },
    bg: '#F6DCDA',
    resume: 'Un nœud de ruban qui garde vos bagues et vos boucles d’oreilles.',
    specs: { largeur: '14 cm', impression: '2 h 20', couche: '0,16 mm', poids: '60 g' },
  },
];

export const productBySlug = (slug) => products.find((p) => p.slug === slug);
export const collectionBySlug = (slug) => collections.find((c) => c.slug === slug);
export const productsIn = (slug) => products.filter((p) => p.collection === slug);

/**
 * Example customer messages, styled like the shop's DM feedback highlights.
 * PLACEHOLDERS: replace with real screenshots or quotes before going live.
 */
export const avis = [
  { nom: 'sara.dz', texte: 'Wsselni le vase citron, ya3tik saha 😍 mieux que sur les photos', wilaya: 'Alger' },
  { nom: 'yacine_b', texte: 'Le gorille porte mes Ray-Ban mieux que moi. 10/10', wilaya: 'Oran' },
  { nom: 'lina.decor', texte: 'Livraison rapide, emballage nickel, rien de cassé 🙏', wilaya: 'Sétif' },
  { nom: 'amine.k', texte: "J'ai pris le Samurai pour mon bureau, tout le monde demande d'où il vient", wilaya: 'Constantine' },
  { nom: 'meriem', texte: 'La lampe vague le soir… khlass, c’est ma pièce préférée', wilaya: 'Blida' },
  { nom: 'rayan.art', texte: 'Commandé le lundi, reçu le jeudi à Ouargla. Respect', wilaya: 'Ouargla' },
  { nom: 'nesrine_h', texte: 'Le nœud pour mes bagues est trop mignon, j’en reprends un pour ma sœur', wilaya: 'Tlemcen' },
  { nom: 'walid', texte: 'Qualité d’impression propre, on voit à peine les couches 👌', wilaya: 'Béjaïa' },
];

export const wilayas = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida',
  'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel',
  'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa',
  'Mostaganem', "M'Sila", 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj',
  'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza',
  'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane', 'Timimoun',
  'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès', 'In Salah', 'In Guezzam', 'Touggourt',
  'Djanet', "El M'Ghair", 'El Meniaa',
];
