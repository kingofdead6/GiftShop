/**
 * Atelier illueur — brand constants.
 *
 * Everything the shop owner would want to change without touching layout lives
 * here: handles, the WhatsApp number, and whether prices are shown at all.
 *
 * Orders go through Instagram DMs today. The site does not replace that: it
 * answers the "prix ?" question up front and hands the customer a ready-made
 * message to paste into the DM, so the conversation starts at "I want this one
 * in green" instead of "how much".
 */

export const brand = {
  name: 'illueur',
  atelier: 'Atelier illueur',
  tagline: 'Design & Décor, Made in Algeria',
  instagram: 'illueur',
  // Empty hides every WhatsApp button. Fill with the international number
  // (no + or spaces, e.g. 213555000000) to turn them on.
  whatsapp: '',
  followers: '27.7K',
  posts: 144,
};

/**
 * Demo prices. The real shop does not publish prices yet; these placeholders
 * show what the site looks like once it does. Set to false to switch every
 * price on the site to "Prix en DM".
 */
export const showPrices = true;

export const instagramUrl = `https://instagram.com/${brand.instagram}`;
export const instagramDmUrl = `https://ig.me/m/${brand.instagram}`;

export const whatsappUrl = (text) =>
  brand.whatsapp ? `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(text)}` : null;

export const formatDA = (n) => `${new Intl.NumberFormat('fr-DZ').format(n)} DA`;
