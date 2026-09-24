/**
 * Legacy Storage Purge
 * Hard Security Requirement:
 * Any lingering pre-migration keys in localStorage, sessionStorage,
 * IndexedDB, or Cache Storage must be wiped clean on app boot
 * to guarantee zero user data exists in the browser.
 */

/* eslint-disable no-restricted-globals */
export function purgeLegacyClientStorage() {
  if (typeof window === 'undefined') return;

  try {
    const ls = window.localStorage;
    if (ls && typeof ls.clear === 'function') {
      ls.clear();
    }
  } catch (_) {}

  try {
    const ss = window.sessionStorage;
    if (ss && typeof ss.clear === 'function') {
      ss.clear();
    }
  } catch (_) {}

  try {
    const idb = window.indexedDB;
    if (idb) {
      if (typeof idb.deleteDatabase === 'function') {
        ['firebaseLocalStorageDb', 'firebase-heartbeat-database', 'firebase-installations-database'].forEach((name) => {
          try { idb.deleteDatabase(name); } catch (_) {}
        });
      }
      if (typeof idb.databases === 'function') {
        idb.databases().then((databases) => {
          (databases || []).forEach((db) => {
            if (db.name) {
              idb.deleteDatabase(db.name);
            }
          });
        }).catch(() => {});
      }
    }
  } catch (_) {}

  try {
    if ('caches' in window && window.caches && typeof window.caches.keys === 'function') {
      window.caches.keys().then((keys) => {
        (keys || []).forEach((k) => window.caches.delete(k));
      }).catch(() => {});
    }
  } catch (_) {}
}
