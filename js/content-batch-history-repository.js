import { normalizeBatchHistoryRecord } from "./content-batch-history-model.js";

const DB_NAME = "mathhard-content-batch-history";
const DB_VERSION = 1;
const STORE_NAME = "batches";
const FALLBACK_KEY = "mh.content.batch.history.v1";
const MAX_RECORDS_PER_USER = 25;

function text(value) {
  return String(value ?? "").trim();
}

function storageKey(userId) {
  return `${FALLBACK_KEY}:${text(userId)}`;
}

function fallbackRead(storage, userId) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(storageKey(userId)) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeBatchHistoryRecord).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function fallbackWrite(storage, userId, records) {
  try {
    storage?.setItem?.(storageKey(userId), JSON.stringify(records.slice(0, MAX_RECORDS_PER_USER)));
    return true;
  } catch {
    return false;
  }
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted."));
  });
}

function openDatabase(indexedDB) {
  if (!indexedDB?.open) return Promise.reject(new Error("IndexedDB unavailable."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("userId", "userId", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed."));
  });
}

export function createMemoryBatchHistoryRepository(seed = []) {
  const map = new Map(seed.map((record) => [`${record.userId}:${record.id}`, structuredClone(record)]));
  return {
    async list(userId, limit = MAX_RECORDS_PER_USER) {
      return [...map.values()].filter((record) => record.userId === userId)
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, limit).map((record) => structuredClone(record));
    },
    async get(userId, id) { return structuredClone(map.get(`${userId}:${id}`) || null); },
    async save(userId, record) {
      const normalized = { ...structuredClone(record), userId, key: `${userId}:${record.id}` };
      map.set(normalized.key, normalized);
      return structuredClone(normalized);
    },
    async remove(userId, id) { return map.delete(`${userId}:${id}`); },
    async clear(userId) {
      for (const key of [...map.keys()]) if (key.startsWith(`${userId}:`)) map.delete(key);
    }
  };
}

export function createContentBatchHistoryRepository({
  indexedDB = globalThis.indexedDB,
  storage = globalThis.localStorage
} = {}) {
  let databasePromise = null;
  const database = () => databasePromise ||= openDatabase(indexedDB);

  async function withFallback(indexedAction, fallbackAction) {
    try {
      return await indexedAction(await database());
    } catch {
      databasePromise = null;
      return fallbackAction();
    }
  }

  async function list(userId, limit = MAX_RECORDS_PER_USER) {
    const cleanUserId = text(userId);
    if (!cleanUserId) return [];
    return withFallback(async (db) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const rows = await requestResult(transaction.objectStore(STORE_NAME).index("userId").getAll(cleanUserId));
      return rows.map(normalizeBatchHistoryRecord).filter(Boolean)
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, limit);
    }, () => fallbackRead(storage, cleanUserId).slice(0, limit));
  }

  async function get(userId, id) {
    const cleanUserId = text(userId);
    const cleanId = text(id);
    if (!cleanUserId || !cleanId) return null;
    return withFallback(async (db) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      return normalizeBatchHistoryRecord(await requestResult(transaction.objectStore(STORE_NAME).get(`${cleanUserId}:${cleanId}`)));
    }, () => fallbackRead(storage, cleanUserId).find((record) => record.id === cleanId) || null);
  }

  async function save(userId, record) {
    const cleanUserId = text(userId);
    const normalized = normalizeBatchHistoryRecord({ ...record, userId: cleanUserId });
    if (!cleanUserId || !normalized?.id) throw new Error("A user and batch record are required.");
    const row = { ...normalized, key: `${cleanUserId}:${normalized.id}` };
    return withFallback(async (db) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(row);
      await transactionDone(transaction);
      const records = await list(cleanUserId, 1000);
      for (const stale of records.slice(MAX_RECORDS_PER_USER)) await remove(cleanUserId, stale.id);
      return normalized;
    }, () => {
      const records = fallbackRead(storage, cleanUserId).filter((entry) => entry.id !== normalized.id);
      records.unshift(normalized);
      if (!fallbackWrite(storage, cleanUserId, records)) throw new Error("Batch history storage is full.");
      return normalized;
    });
  }

  async function remove(userId, id) {
    const cleanUserId = text(userId);
    const cleanId = text(id);
    if (!cleanUserId || !cleanId) return false;
    return withFallback(async (db) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(`${cleanUserId}:${cleanId}`);
      await transactionDone(transaction);
      return true;
    }, () => fallbackWrite(storage, cleanUserId, fallbackRead(storage, cleanUserId).filter((entry) => entry.id !== cleanId)));
  }

  async function clear(userId) {
    const records = await list(userId, 1000);
    for (const record of records) await remove(userId, record.id);
  }

  return { list, get, save, remove, clear };
}
