import mongoose from 'mongoose';

export const STATUTS_DEMANDE = ['NOUVELLE', 'CONFIRMEE', 'EN_IMPRESSION', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];

/**
 * A demande is an illueur order request. Ordering itself still happens in the
 * Instagram DM; this is the record of it, so the customer can follow it from
 * their account and the shop can track it from the admin instead of scrolling
 * back through DMs.
 *
 * Lines copy name, colour and price at the time of the request, because the
 * catalogue is edited in the client and a request must not re-price itself.
 */
const ligneSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true },
    nom: { type: String, required: true, trim: true },
    couleur: { type: String, trim: true, default: '' },
    qte: { type: Number, required: true, min: 1, max: 9 },
    prix: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const historiqueSchema = new mongoose.Schema(
  {
    statut: { type: String, enum: STATUTS_DEMANDE, required: true },
    date: { type: Date, default: Date.now },
    par: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const demandeSchema = new mongoose.Schema(
  {
    numero: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lignes: { type: [ligneSchema], validate: [(v) => v.length > 0 && v.length <= 30, 'La demande est vide'] },
    total: { type: Number, min: 0, default: 0 },
    wilaya: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    statut: { type: String, enum: STATUTS_DEMANDE, default: 'NOUVELLE', index: true },
    historique: { type: [historiqueSchema], default: () => [{ statut: 'NOUVELLE' }] },
    noteInterne: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Demande', demandeSchema);
