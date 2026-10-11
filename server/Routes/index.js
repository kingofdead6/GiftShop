import express from 'express';
import multer from 'multer';

import { protect, admin, superAdmin } from '../Middleware/auth.js';

import * as auth from '../Controllers/authController.js';
import * as products from '../Controllers/productController.js';
import * as categories from '../Controllers/categoryController.js';
import * as wilayas from '../Controllers/wilayaController.js';
import * as orders from '../Controllers/orderController.js';
import * as settings from '../Controllers/settingsController.js';
import * as messages from '../Controllers/messageController.js';
import * as dashboard from '../Controllers/dashboardController.js';
import * as illueur from '../Controllers/illueurController.js';
import * as catalogue from '../Controllers/catalogueController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont acceptées'), false);
  },
});

const router = express.Router();

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', auth.me);
router.put('/auth/profile', protect, auth.updateProfile);
router.put('/auth/password', protect, auth.changePassword);
router.post('/auth/adresses', protect, auth.addAddress);
router.delete('/auth/adresses/:addressId', protect, auth.deleteAddress);
router.get('/auth/favoris', protect, auth.listFavourites);
router.post('/auth/favoris/:productId', protect, auth.toggleFavourite);

// ── illueur: wishlist and demandes ──────────────────────────────────────────
router.post('/auth/wishlist/:slug', protect, illueur.toggleWishlist);
router.post('/demandes', protect, illueur.createDemande);
router.get('/demandes/mine', protect, illueur.myDemandes);

router.get('/catalogue', catalogue.getCatalogue);
router.get('/admin/catalogue', admin, catalogue.adminCatalogue);
router.post('/admin/pieces', admin, catalogue.createPiece);
router.put('/admin/pieces/reorder', admin, catalogue.reorderPieces);
router.put('/admin/pieces/:id', admin, catalogue.updatePiece);
router.delete('/admin/pieces/:id', admin, catalogue.deletePiece);
router.post('/admin/pieces/:id/photo', admin, upload.single('photo'), catalogue.uploadPiecePhoto);
router.delete('/admin/pieces/:id/photo', admin, catalogue.deletePiecePhoto);
router.post('/admin/collections', admin, catalogue.createCollection);
router.put('/admin/collections/reorder', admin, catalogue.reorderCollections);
router.put('/admin/collections/:id', admin, catalogue.updateCollection);
router.delete('/admin/collections/:id', admin, catalogue.deleteCollection);

router.get('/admin/illueur/overview', admin, illueur.overview);
router.get('/admin/demandes', admin, illueur.listDemandes);
router.put('/admin/demandes/:id', admin, illueur.updateDemande);
router.get('/admin/users', admin, illueur.listUsers);
router.put('/admin/users/:id/role', admin, superAdmin, illueur.setUserRole);

// ── Catalogue (public) ───────────────────────────────────────────────────────
router.get('/products', products.listProducts);
router.get('/products/filters', products.getFilterOptions);
router.get('/products/:idOrSlug', products.getProduct);

router.get('/categories', categories.listCategories);
router.get('/categories/:slug', categories.getCategory);

router.get('/wilayas', wilayas.listWilayas);
router.get('/livraison/quote', wilayas.quoteDelivery);

router.get('/settings', settings.readSettings);

// ── Orders ───────────────────────────────────────────────────────────────────
// Guest checkout is the default path, so this is deliberately unauthenticated.
// attachUser still runs upstream, so a logged-in customer gets userId set.
router.post('/orders', orders.createOrder);
router.get('/orders/lookup', orders.lookupOrder);
router.get('/orders/mine', protect, orders.myOrders);

router.post('/messages', messages.createMessage);

// ── Admin ────────────────────────────────────────────────────────────────────
router.get('/admin/dashboard', admin, dashboard.getDashboard);

router.get('/admin/products', admin, products.listProducts);
router.post('/admin/products', admin, upload.array('images', 8), products.createProduct);
router.put('/admin/products/:id', admin, upload.array('images', 8), products.updateProduct);
router.delete('/admin/products/:id', admin, products.deleteProduct);

router.get('/admin/categories', admin, categories.listAllCategories);
router.post('/admin/categories', admin, upload.single('image'), categories.createCategory);
router.put('/admin/categories/reorder', admin, categories.reorderCategories);
router.put('/admin/categories/:id', admin, upload.single('image'), categories.updateCategory);
router.delete('/admin/categories/:id', admin, categories.deleteCategory);

router.get('/admin/orders', admin, orders.listOrders);
router.get('/admin/orders/:id', admin, orders.getOrder);
router.put('/admin/orders/:id/statut', admin, orders.updateOrderStatus);
router.put('/admin/orders/:id/note', admin, orders.updateOrderNote);

router.put('/admin/wilayas/bulk', admin, wilayas.bulkUpdateWilayas);
router.put('/admin/wilayas/:id', admin, wilayas.updateWilaya);

router.get('/admin/messages', admin, messages.listMessages);
router.put('/admin/messages/:id', admin, messages.updateMessageStatus);
router.delete('/admin/messages/:id', admin, messages.deleteMessage);

router.put('/admin/settings', admin, settings.updateSettings);

export default router;
