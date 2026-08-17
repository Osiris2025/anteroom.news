"use client";

/**
 * dm-key-store.ts — IndexedDB key storage for ECDH key pairs
 *
 * Stores the user's ECDH private key in IndexedDB so it persists
 * across sessions. The private key never leaves the browser.
 *
 * Database: "nexus-dm-keys"
 * Store:    "keypairs"
 * Key:      "current"
 */

const DB_NAME = "nexus-dm-keys";
const STORE_NAME = "keypairs";
const DB_VERSION = 1;
const KEY_NAME = "current";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredKeyPair {
  privateKeyPem: string;
  publicKeyPem: string;
}

/**
 * Save the current key pair (private + public key PEMs) to IndexedDB.
 */
export async function saveKeyPair(keyPair: StoredKeyPair): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(keyPair, KEY_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    tx.oncomplete = () => db.close();
  });
}

/**
 * Load the current key pair from IndexedDB.
 * Returns null if no key pair is stored.
 */
export async function loadKeyPair(): Promise<StoredKeyPair | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(KEY_NAME);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);

    tx.oncomplete = () => db.close();
  });
}

/**
 * Delete the stored key pair from IndexedDB.
 */
export async function deleteKeyPair(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(KEY_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    tx.oncomplete = () => db.close();
  });
}