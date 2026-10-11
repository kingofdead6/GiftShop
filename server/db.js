import mongoose from 'mongoose';

/**
 * One place that opens the database, for the API and every script.
 *
 * The cluster in MONGO_URI is shared with the Evora Home site, whose data lives
 * in the URI's default database. illueur gets its own database on that cluster
 * so accounts and demandes never mix with Evora's collections. Override with
 * MONGO_DB_NAME; the default is deliberately not the URI's default.
 */
export const DB_NAME = process.env.MONGO_DB_NAME || 'illueur';

export function connectDb() {
  return mongoose.connect(process.env.MONGO_URI, { dbName: DB_NAME });
}
