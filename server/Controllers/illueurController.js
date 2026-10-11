import { asyncHandler } from '../utils/asyncHandler.js';
import User, { ROLES } from '../Models/User.js';
import Demande, { STATUTS_DEMANDE } from '../Models/Demande.js';
import { nextDemandeNumber } from '../Models/Counter.js';

const SLUG = /^[a-z0-9-]{1,80}$/;
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Wishlist ────────────────────────────────────────────────────────────────

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  if (!SLUG.test(slug)) {
    res.status(400);
    throw new Error('Pièce invalide');
  }
  const i = req.user.wishlist.indexOf(slug);
  if (i >= 0) req.user.wishlist.splice(i, 1);
  else if (req.user.wishlist.length < 200) req.user.wishlist.push(slug);
  await req.user.save();
  res.json({ wishlist: req.user.wishlist, saved: i < 0 });
});

// ── Demandes (customer) ─────────────────────────────────────────────────────

export const createDemande = asyncHandler(async (req, res) => {
  const { lignes, wilaya, note } = req.body;

  if (!Array.isArray(lignes) || !lignes.length || lignes.length > 30) {
    res.status(400);
    throw new Error('La demande est vide');
  }

  const clean = lignes.map((l) => ({
    slug: String(l.slug || '').trim(),
    nom: String(l.nom || '').trim().slice(0, 120),
    couleur: String(l.couleur || '').trim().slice(0, 60),
    qte: Math.min(9, Math.max(1, parseInt(l.qte, 10) || 1)),
    prix: Math.max(0, Number(l.prix) || 0),
  }));

  if (clean.some((l) => !SLUG.test(l.slug) || !l.nom)) {
    res.status(400);
    throw new Error('Une pièce de la demande est invalide');
  }

  const demande = await Demande.create({
    numero: await nextDemandeNumber(),
    userId: req.user._id,
    lignes: clean,
    total: clean.reduce((n, l) => n + l.prix * l.qte, 0),
    wilaya: String(wilaya || req.user.wilaya || '').trim().slice(0, 60),
    note: String(note || '').trim().slice(0, 500),
  });

  res.status(201).json(demande);
});

export const myDemandes = asyncHandler(async (req, res) => {
  const demandes = await Demande.find({ userId: req.user._id }).select('-noteInterne').sort({ createdAt: -1 }).limit(100);
  res.json(demandes);
});

// ── Admin ───────────────────────────────────────────────────────────────────

export const overview = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [clients, nouveauxClients, parStatut, recentes, topPieces, ca] = await Promise.all([
    User.countDocuments({ role: 'CLIENT' }),
    User.countDocuments({ role: 'CLIENT', createdAt: { $gte: since } }),
    Demande.aggregate([{ $group: { _id: '$statut', n: { $sum: 1 } } }]),
    Demande.find().sort({ createdAt: -1 }).limit(6).populate('userId', 'nom telephone'),
    Demande.aggregate([
      { $match: { statut: { $ne: 'ANNULEE' } } },
      { $unwind: '$lignes' },
      { $group: { _id: '$lignes.slug', nom: { $first: '$lignes.nom' }, qte: { $sum: '$lignes.qte' } } },
      { $sort: { qte: -1 } },
      { $limit: 5 },
    ]),
    Demande.aggregate([
      { $match: { statut: { $in: ['CONFIRMEE', 'EN_IMPRESSION', 'EXPEDIEE', 'LIVREE'] }, createdAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  res.json({
    clients,
    nouveauxClients,
    statuts: Object.fromEntries(STATUTS_DEMANDE.map((s) => [s, parStatut.find((p) => p._id === s)?.n || 0])),
    recentes,
    topPieces,
    chiffre30j: ca[0]?.total || 0,
  });
});

export const listDemandes = asyncHandler(async (req, res) => {
  const { statut, q } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 20;
  const filter = {};
  if (statut && STATUTS_DEMANDE.includes(statut)) filter.statut = statut;

  if (q?.trim()) {
    const rx = new RegExp(escapeRx(q.trim()), 'i');
    const users = await User.find({ $or: [{ nom: rx }, { telephone: rx }, { email: rx }] }).select('_id').limit(200);
    filter.$or = [{ numero: rx }, { userId: { $in: users.map((u) => u._id) } }];
  }

  const [items, total] = await Promise.all([
    Demande.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'nom telephone email wilaya'),
    Demande.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

export const updateDemande = asyncHandler(async (req, res) => {
  const { statut, noteInterne } = req.body;
  const demande = await Demande.findById(req.params.id);
  if (!demande) {
    res.status(404);
    throw new Error('Demande introuvable');
  }
  if (statut !== undefined) {
    if (!STATUTS_DEMANDE.includes(statut)) {
      res.status(400);
      throw new Error('Statut invalide');
    }
    if (statut !== demande.statut) {
      demande.statut = statut;
      demande.historique.push({ statut, par: req.user.nom });
    }
  }
  if (noteInterne !== undefined) demande.noteInterne = String(noteInterne).slice(0, 1000);
  await demande.save();
  await demande.populate('userId', 'nom telephone email wilaya');
  res.json(demande);
});

export const listUsers = asyncHandler(async (req, res) => {
  const { q, role } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 25;
  const filter = {};
  if (role && ROLES.includes(role)) filter.role = role;
  if (q?.trim()) {
    const rx = new RegExp(escapeRx(q.trim()), 'i');
    filter.$or = [{ nom: rx }, { telephone: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  const counts = await Demande.aggregate([
    { $match: { userId: { $in: users.map((u) => u._id) } } },
    { $group: { _id: '$userId', n: { $sum: 1 } } },
  ]);
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

  res.json({
    items: users.map((u) => ({ ...u.toPublic(), demandes: byId[String(u._id)] || 0 })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

/** Super admin only: promote a client to admin or back. */
export const setUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['CLIENT', 'ADMIN'].includes(role)) {
    res.status(400);
    throw new Error('Rôle invalide');
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur introuvable');
  }
  if (user.role === 'SUPER_ADMIN') {
    res.status(403);
    throw new Error('Le super administrateur ne peut pas être modifié');
  }
  user.role = role;
  await user.save();
  res.json(user.toPublic());
});
