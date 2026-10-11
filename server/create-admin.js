import 'dotenv/config';
import crypto from 'node:crypto';
import mongoose from 'mongoose';

import User, { normalisePhone, isValidPhone } from './Models/User.js';
import { connectDb, DB_NAME } from './db.js';

/**
 * Creates (or promotes) the illueur super admin.
 *
 *   npm run create-admin
 *
 * Credentials come from server/.env:
 *   ADMIN_EMAIL     default admin@illueur.dz
 *   ADMIN_PHONE     default 0550000000 (an admin can log in with either)
 *   ADMIN_NAME      default Atelier illueur
 *   ADMIN_PASSWORD  if unset, a random one is generated and printed once
 *
 * Re-running on an existing account only fixes its role: it never resets a
 * password someone has already changed.
 */

const REQUIRED = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  process.exit(1);
}

const email = (process.env.ADMIN_EMAIL || 'admin@illueur.dz').trim().toLowerCase();
const telephone = process.env.ADMIN_PHONE || '0550000000';
const nom = process.env.ADMIN_NAME || 'Atelier illueur';
const generated = !process.env.ADMIN_PASSWORD;
const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
const role = 'SUPER_ADMIN';

async function main() {
  if (!isValidPhone(telephone)) throw new Error(`ADMIN_PHONE invalide: ${telephone}`);
  if (password.length < 6) throw new Error('ADMIN_PASSWORD doit contenir au moins 6 caractères');

  await connectDb();
  console.log(`MongoDB connecté (base: ${DB_NAME})`);

  const existing = await User.findOne({ $or: [{ email }, { telephone: normalisePhone(telephone) }] });
  if (existing) {
    if (existing.role !== role) {
      existing.role = role;
      await existing.save();
      console.log(`${existing.email || existing.telephone} est maintenant ${role}.`);
    } else {
      console.log(`Le compte ${existing.email || existing.telephone} existe déjà (${role}). Mot de passe inchangé.`);
    }
    return;
  }

  await new User({ nom, telephone, email, passwordHash: password, role }).save();

  console.log('\nCompte super admin créé');
  console.log(`  Email       ${email}`);
  console.log(`  Téléphone   ${normalisePhone(telephone)}`);
  console.log(`  Mot de passe ${password}${generated ? '   (généré, notez-le maintenant)' : ''}`);
}

main()
  .catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect().catch(() => {}));
