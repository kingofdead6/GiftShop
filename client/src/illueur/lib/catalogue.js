import { useSyncExternalStore } from 'react';
import api from './api';
import { collections as staticCollections, products as staticProducts } from '../data/catalogue';

/**
 * The live catalogue.
 *
 * Boots from the bundled data (data/catalogue.js) so the first paint never
 * waits on the network and the site still works if the API is down, then
 * swaps in what the admin has published. Admin edits call `setCatalogue`
 * directly so changes appear on the storefront without a reload.
 */

let state = build(staticCollections, staticProducts, 'static', false);
const listeners = new Set();

function build(collections, products, source, ready = true) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const collBySlug = new Map(collections.map((c) => [c.slug, c]));
  return {
    collections,
    products,
    source,
    // False until the API has answered (or failed). Pages wait on it before
    // calling a slug unknown, since the bundled catalogue lacks new pieces.
    ready,
    productBySlug: (slug) => bySlug.get(slug),
    collectionBySlug: (slug) => collBySlug.get(slug),
    productsIn: (slug) => products.filter((p) => p.collection === slug),
  };
}

export function setCatalogue(collections, products, source = 'api') {
  state = build(collections, products, source);
  listeners.forEach((l) => l());
}

let loading = null;
export function loadCatalogue() {
  if (!loading) {
    loading = api
      .catalogue()
      .then(({ collections, products }) => {
        if (collections?.length) setCatalogue(collections, products);
        else setCatalogue(state.collections, state.products, 'static');
      })
      .catch(() => {
        // Keep the bundled catalogue, but stop waiting on the API.
        if (!state.ready) setCatalogue(state.collections, state.products, 'static');
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useCatalogue() {
  return useSyncExternalStore(subscribe, () => state);
}

/** Collections on dark tone (lamps) predate the `dark` flag. */
export const isDarkCollection = (c) => c?.dark ?? c?.tone === '#1C1A17';
