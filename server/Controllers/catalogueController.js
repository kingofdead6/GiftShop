import { asyncHandler } from '../utils/asyncHandler.js';
import { Collection, Piece, SHAPES, FIGURES } from '../Models/Piece.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { seedCollections, seedPieces } from '../seed/illueurCatalogue.js';

/**
 * The illueur catalogue: what the storefront shows and what the admin edits.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

/** A slug that is free: the wanted one, or wanted-2, wanted-3… */
async function freeSlug(Model, wanted) {
  const base = slugify(wanted) || 'piece';
  let slug = base;
  for (let i = 2; await Model.exists({ slug }); i++) slug = `${base}-${i}`;
  return slug;
}

/** Seed the catalogue on first boot, so a fresh deployment is never empty. */
export async function seedCatalogueIfEmpty() {
  const [c, p] = await Promise.all([Collection.estimatedDocumentCount(), Piece.estimatedDocumentCount()]);
  if (c || p) return false;
  await Collection.insertMany(seedCollections);
  await Piece.insertMany(seedPieces.map(({ collection, ...rest }) => ({ ...rest, famille: collection })));
  return true;
}

// ── Public ──────────────────────────────────────────────────────────────────

export const getCatalogue = asyncHandler(async (req, res) => {
  const [collections, pieces] = await Promise.all([
    Collection.find().sort({ ordre: 1, createdAt: 1 }),
    Piece.find({ actif: true }).sort({ ordre: 1, createdAt: 1 }).select('-photoId'),
  ]);
  // Revalidate every time: Express's ETag turns an unchanged catalogue into a
  // cheap 304, and an admin edit is visible on the very next page load.
  res.set('Cache-Control', 'no-cache');
  res.json({ collections, products: pieces });
});

// ── Admin: read ─────────────────────────────────────────────────────────────

export const adminCatalogue = asyncHandler(async (req, res) => {
  const [collections, pieces] = await Promise.all([
    Collection.find().sort({ ordre: 1, createdAt: 1 }),
    Piece.find().sort({ ordre: 1, createdAt: 1 }),
  ]);
  res.json({ collections, products: pieces, shapes: SHAPES, figures: FIGURES });
});

// ── Admin: pieces ───────────────────────────────────────────────────────────

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Whitelist and shape the editable fields of a piece. */
function pieceFields(body) {
  const out = {};
  if (body.nom !== undefined) out.nom = String(body.nom).trim();
  if (body.collection !== undefined) out.famille = String(body.collection).trim();
  if (body.prix !== undefined) out.prix = Math.max(0, Math.round(Number(body.prix) || 0));
  if (body.resume !== undefined) out.resume = String(body.resume).trim();
  if (body.bg !== undefined) out.bg = body.bg;
  if (body.dark !== undefined) out.dark = Boolean(body.dark);
  if (body.featured !== undefined) out.featured = Boolean(body.featured);
  if (body.actif !== undefined) out.actif = Boolean(body.actif);
  if (Array.isArray(body.couleurs)) {
    out.couleurs = body.couleurs
      .map((c) => ({ nom: String(c.nom || '').trim(), hex: String(c.hex || '').trim() }))
      .filter((c) => c.nom && HEX.test(c.hex));
  }
  if (body.art && typeof body.art === 'object') {
    out.art = {
      kind: body.art.kind === 'figure' ? 'figure' : 'layers',
      shape: body.art.shape || null,
      figure: body.art.figure || null,
      glow: Boolean(body.art.glow),
    };
  }
  if (body.specs && typeof body.specs === 'object') {
    const entries = Array.isArray(body.specs) ? body.specs.map((s) => [s.k, s.v]) : Object.entries(body.specs);
    out.specs = Object.fromEntries(
      entries
        .map(([k, v]) => [String(k || '').trim().slice(0, 30), String(v || '').trim().slice(0, 60)])
        .filter(([k, v]) => k && v)
        .slice(0, 10)
    );
  }
  return out;
}

async function assertCollection(res, slug) {
  if (slug !== undefined && !(await Collection.exists({ slug }))) {
    res.status(400);
    throw new Error('Cette collection n’existe pas');
  }
}

export const createPiece = asyncHandler(async (req, res) => {
  const fields = pieceFields(req.body);
  await assertCollection(res, fields.famille);
  const wanted = req.body.slug && SLUG.test(req.body.slug) ? req.body.slug : fields.nom;
  const last = await Piece.findOne().sort({ ordre: -1 }).select('ordre');
  const piece = await Piece.create({ ...fields, slug: await freeSlug(Piece, wanted), ordre: (last?.ordre ?? -1) + 1 });
  res.status(201).json(piece);
});

export const updatePiece = asyncHandler(async (req, res) => {
  const piece = await Piece.findById(req.params.id);
  if (!piece) {
    res.status(404);
    throw new Error('Pièce introuvable');
  }
  const fields = pieceFields(req.body);
  await assertCollection(res, fields.famille);
  // Slug is deliberately not editable: wishlists and demandes reference it.
  piece.set(fields);
  if (fields.specs) piece.markModified('specs');
  await piece.save();
  res.json(piece);
});

export const deletePiece = asyncHandler(async (req, res) => {
  const piece = await Piece.findById(req.params.id);
  if (!piece) {
    res.status(404);
    throw new Error('Pièce introuvable');
  }
  if (piece.photoId) await deleteFromCloudinary(piece.photoId).catch(() => {});
  await piece.deleteOne();
  await Collection.updateMany({ hero: piece.slug }, { hero: '' });
  res.json({ message: 'Pièce supprimée' });
});

export const uploadPiecePhoto = asyncHandler(async (req, res) => {
  const piece = await Piece.findById(req.params.id);
  if (!piece) {
    res.status(404);
    throw new Error('Pièce introuvable');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('Aucune image reçue');
  }
  const uploaded = await uploadToCloudinary(req.file, { folder: 'illueur' });
  if (piece.photoId) await deleteFromCloudinary(piece.photoId).catch(() => {});
  // Without Cloudinary the file is served by this API from /products; the
  // storefront lives on another origin, so the URL must be absolute.
  piece.photo = uploaded.url.startsWith('/') ? `${req.protocol}://${req.get('host')}${uploaded.url}` : uploaded.url;
  piece.photoId = uploaded.publicId || '';
  await piece.save();
  res.json(piece);
});

export const deletePiecePhoto = asyncHandler(async (req, res) => {
  const piece = await Piece.findById(req.params.id);
  if (!piece) {
    res.status(404);
    throw new Error('Pièce introuvable');
  }
  if (piece.photoId) await deleteFromCloudinary(piece.photoId).catch(() => {});
  piece.photo = '';
  piece.photoId = '';
  await piece.save();
  res.json(piece);
});

/** Body: { ids: [...] } in display order. */
export const reorderPieces = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  await Piece.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { ordre: i } } })));
  res.json({ message: 'Ordre enregistré' });
});

// ── Admin: collections ──────────────────────────────────────────────────────

function collectionFields(body) {
  const out = {};
  if (body.nom !== undefined) out.nom = String(body.nom).trim();
  if (body.accroche !== undefined) out.accroche = String(body.accroche).trim();
  if (body.tone !== undefined) out.tone = body.tone;
  if (body.dark !== undefined) out.dark = Boolean(body.dark);
  if (body.nouveau !== undefined) out.nouveau = Boolean(body.nouveau);
  if (body.hero !== undefined) out.hero = String(body.hero || '').trim();
  return out;
}

export const createCollection = asyncHandler(async (req, res) => {
  const fields = collectionFields(req.body);
  const wanted = req.body.slug && SLUG.test(req.body.slug) ? req.body.slug : fields.nom;
  const last = await Collection.findOne().sort({ ordre: -1 }).select('ordre');
  const coll = await Collection.create({ ...fields, slug: await freeSlug(Collection, wanted), ordre: (last?.ordre ?? -1) + 1 });
  res.status(201).json(coll);
});

export const updateCollection = asyncHandler(async (req, res) => {
  const coll = await Collection.findById(req.params.id);
  if (!coll) {
    res.status(404);
    throw new Error('Collection introuvable');
  }
  coll.set(collectionFields(req.body));
  await coll.save();
  res.json(coll);
});

/**
 * Refuses while pieces still belong to the collection, unless `moveTo` names
 * another collection to move them into first. Nothing is ever deleted by
 * cascade.
 */
export const deleteCollection = asyncHandler(async (req, res) => {
  const coll = await Collection.findById(req.params.id);
  if (!coll) {
    res.status(404);
    throw new Error('Collection introuvable');
  }
  const count = await Piece.countDocuments({ famille: coll.slug });
  const moveTo = req.query.moveTo;
  if (count) {
    if (!moveTo) {
      res.status(409);
      throw new Error(`Cette collection contient ${count} pièce(s). Déplacez-les d’abord.`);
    }
    if (moveTo === coll.slug || !(await Collection.exists({ slug: moveTo }))) {
      res.status(400);
      throw new Error('Collection de destination invalide');
    }
    await Piece.updateMany({ famille: coll.slug }, { famille: moveTo });
  }
  await coll.deleteOne();
  res.json({ message: 'Collection supprimée', moved: count });
});

export const reorderCollections = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  await Collection.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { ordre: i } } })));
  res.json({ message: 'Ordre enregistré' });
});
