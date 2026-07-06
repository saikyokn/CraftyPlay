import type { PublishedWorld } from "@/types/catalog";
import { createDefaultWorld } from "@/utils/world";

const DB_NAME = "craftyplay-platform";
const DB_VERSION = 1;

const STORES = {
  users: "users",
  skins: "skins",
  worlds: "worlds",
  playHistory: "playHistory",
  settings: "settings",
} as const;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.users)) {
        const users = db.createObjectStore(STORES.users, { keyPath: "id" });
        users.createIndex("username", "username", { unique: true });
        users.createIndex("email", "email", { unique: true });
      }
      if (!db.objectStoreNames.contains(STORES.skins)) {
        const skins = db.createObjectStore(STORES.skins, { keyPath: "id" });
        skins.createIndex("userId", "userId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.worlds)) {
        const worlds = db.createObjectStore(STORES.worlds, { keyPath: "id" });
        worlds.createIndex("authorId", "authorId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.playHistory)) {
        db.createObjectStore(STORES.playHistory, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = run(store);
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB tx failed"));
      }),
  );
}

export async function platformPut<T extends { id: string }>(
  store: keyof typeof STORES,
  record: T,
): Promise<void> {
  await tx(STORES[store], "readwrite", (s) => s.put(record));
}

export async function platformGet<T>(
  store: keyof typeof STORES,
  id: string,
): Promise<T | null> {
  const result = await tx<T | undefined>(STORES[store], "readonly", (s) => s.get(id));
  return result ?? null;
}

export async function platformGetAll<T>(store: keyof typeof STORES): Promise<T[]> {
  return tx<T[]>(STORES[store], "readonly", (s) => s.getAll());
}

export async function platformGetByIndex<T>(
  store: keyof typeof STORES,
  indexName: string,
  value: string,
): Promise<T | null> {
  const result = await tx<T | undefined>(STORES[store], "readonly", (s) =>
    s.index(indexName).get(value),
  );
  return result ?? null;
}

export async function platformGetAllByIndex<T>(
  store: keyof typeof STORES,
  indexName: string,
  value: string,
): Promise<T[]> {
  return tx<T[]>(STORES[store], "readonly", (s) => s.index(indexName).getAll(value));
}

export async function platformSetSetting(key: string, value: string): Promise<void> {
  await tx(STORES.settings, "readwrite", (s) => s.put({ key, value }));
}

export async function platformGetSetting(key: string): Promise<string | null> {
  const record = await tx<{ key: string; value: string } | undefined>(
    STORES.settings,
    "readonly",
    (s) => s.get(key),
  );
  return record?.value ?? null;
}

const SEED_FLAG = "catalogSeeded";

export async function seedCatalogIfEmpty(): Promise<void> {
  const seeded = await platformGetSetting(SEED_FLAG);
  if (seeded) return;

  const existing = await platformGetAll<PublishedWorld>("worlds");
  if (existing.length > 0) {
    await platformSetSetting(SEED_FLAG, "1");
    return;
  }

  const samples: PublishedWorld[] = [
    {
      id: "world-obby-01",
      title: "Rainbow Obby",
      description: "ジャンプパズルで頂上を目指せ！初心者向けの定番コース。",
      authorId: "system",
      authorName: "CraftyPlay",
      thumbnail: "linear-gradient(135deg, #6366f1, #ec4899)",
      plays: 12840,
      likes: 892,
      tags: ["Obby", "Beginner"],
      world: createDefaultWorld(),
      publishedAt: "2026-06-01T00:00:00.000Z",
      featured: true,
    },
    {
      id: "world-tycoon-01",
      title: "Neon Tycoon",
      description: "ネオン街でビジネスを拡大。友達と協力して街を発展させよう。",
      authorId: "system",
      authorName: "PixelNova",
      thumbnail: "linear-gradient(135deg, #22c55e, #06b6d4)",
      plays: 5620,
      likes: 441,
      tags: ["Tycoon", "Simulator"],
      world: createDefaultWorld(),
      publishedAt: "2026-05-15T00:00:00.000Z",
      featured: true,
    },
    {
      id: "world-rp-01",
      title: "Sunset City RP",
      description: "オープンワールドでロールプレイ。カフェ、公園、住宅街が揃う街。",
      authorId: "system",
      authorName: "LunaBuilds",
      thumbnail: "linear-gradient(135deg, #f59e0b, #ef4444)",
      plays: 9100,
      likes: 1203,
      tags: ["RP", "Social"],
      world: createDefaultWorld(),
      publishedAt: "2026-04-20T00:00:00.000Z",
    },
    {
      id: "world-parkour-01",
      title: "Skyline Parkour",
      description: "高層ビルの屋上を飛び越える上級者向けパルクール。",
      authorId: "system",
      authorName: "JumpMaster",
      thumbnail: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
      plays: 3400,
      likes: 287,
      tags: ["Parkour", "Hard"],
      world: createDefaultWorld(),
      publishedAt: "2026-03-10T00:00:00.000Z",
    },
  ];

  for (const world of samples) {
    await platformPut("worlds", world);
  }
  await platformSetSetting(SEED_FLAG, "1");
}
