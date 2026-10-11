import mongoose from 'mongoose';

/**
 * illueur catalogue: collections and pieces.
 *
 * Shapes mirror what the storefront renders (client/src/illueur), so the API
 * can hand documents straight to the components. Pieces point at their
 * collection by slug (field `famille`), and slugs are fixed once created: wishlists and demandes
 * store them, and a renamed slug would orphan both.
 */

export const SHAPES = ['kraft', 'citron', 'cactus', 'sculpte', 'vague', 'flamme'];
export const FIGURES = ['moai', 'meow', 'alien', 'samurai', 'gorille', 'ours', 'rhino', 'buste', 'atlas', 'noeud'];

const HEX = /^#[0-9a-fA-F]{6}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const toClient = (doc, ret) => {
  ret.id = String(ret._id);
  delete ret._id;
  delete ret.__v;
  // Stored as `famille` (`collection` is a Mongoose document property),
  // exposed as `collection` because that is what the storefront reads.
  if ('famille' in ret) {
    ret.collection = ret.famille;
    delete ret.famille;
  }
  return ret;
};

const collectionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, match: [SLUG, 'Slug invalide'] },
    nom: { type: String, required: [true, 'Le nom est requis'], trim: true, maxlength: 60 },
    accroche: { type: String, trim: true, maxlength: 200, default: '' },
    tone: { type: String, match: [HEX, 'Couleur invalide'], default: '#E9DFC9' },
    dark: { type: Boolean, default: false },
    nouveau: { type: Boolean, default: false },
    // Slug of the piece shown on the collection's panel.
    hero: { type: String, trim: true, default: '' },
    ordre: { type: Number, default: 0, index: true },
  },
  { timestamps: true, toJSON: { transform: toClient } }
);

const couleurSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true, maxlength: 40 },
    hex: { type: String, required: true, match: [HEX, 'Couleur invalide'] },
  },
  { _id: false }
);

const pieceSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, match: [SLUG, 'Slug invalide'] },
    nom: { type: String, required: [true, 'Le nom est requis'], trim: true, maxlength: 80 },
    famille: { type: String, required: [true, 'La collection est requise'], trim: true, index: true },
    prix: { type: Number, min: [0, 'Prix invalide'], default: 0 },
    couleurs: {
      type: [couleurSchema],
      validate: [(v) => v.length >= 1 && v.length <= 8, 'Entre 1 et 8 couleurs'],
    },
    art: {
      kind: { type: String, enum: ['layers', 'figure'], default: 'layers' },
      shape: { type: String, enum: [...SHAPES, null], default: null },
      figure: { type: String, enum: [...FIGURES, null], default: null },
      glow: { type: Boolean, default: false },
    },
    // A real photo replaces the drawn art on the storefront.
    photo: { type: String, trim: true, default: '' },
    photoId: { type: String, trim: true, default: '' },
    bg: { type: String, match: [HEX, 'Couleur invalide'], default: '#EFE4D2' },
    dark: { type: Boolean, default: false },
    resume: { type: String, trim: true, maxlength: 400, default: '' },
    // Free label → value pairs, shown in this order on the piece page.
    specs: { type: mongoose.Schema.Types.Mixed, default: {} },
    featured: { type: Boolean, default: false },
    actif: { type: Boolean, default: true, index: true },
    ordre: { type: Number, default: 0, index: true },
  },
  { timestamps: true, toJSON: { transform: toClient } }
);

pieceSchema.pre('validate', function normaliseArt() {
  if (this.art?.kind === 'figure') {
    this.art.shape = null;
    if (!this.art.figure) this.invalidate('art.figure', 'Choisissez une figure');
  } else {
    this.art.figure = null;
    if (!this.art.shape) this.invalidate('art.shape', 'Choisissez une forme');
  }
});

export const Collection = mongoose.model('IllCollection', collectionSchema, 'collections');
export const Piece = mongoose.model('Piece', pieceSchema, 'pieces');
export default Piece;
