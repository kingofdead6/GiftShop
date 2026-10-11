import 'dotenv/config';

import { createApp } from './app.js';
import { connectDb, DB_NAME } from './db.js';

const REQUIRED = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  process.exit(1);
}

const app = createApp();
const PORT = process.env.PORT || 5000;

connectDb()
  .then(() => {
    console.log(`MongoDB connecté (base: ${DB_NAME})`);
    app.listen(PORT, () => console.log(`API sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('Connexion MongoDB impossible:', err.message);
    process.exit(1);
  });
