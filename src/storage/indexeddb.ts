import type { StoredFileHandle, StoredProject } from "@/types/storage";
import type { CraftyPlayWorldExport } from "@/types/world";

const DB_NAME = "craftyplay-editor";
const DB_VERSION = 1;

const STORES = {
  projects: "projects",
  fileHandles: "fileHandles",
  settings: "settings",
} as const;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.projects)) {
        db.createObjectStore(STORES.projects, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.fileHandles)) {
        db.createObjectStore(STORES.fileHandles, { keyPath: "key" });
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

export async function saveProjectToIndexedDB(
  project: StoredProject,
): Promise<void> {
  await tx(STORES.projects, "readwrite", (store) => store.put(project));
}

export async function loadProjectFromIndexedDB(
  id: string,
): Promise<StoredProject | null> {
  const result = await tx<StoredProject | undefined>(STORES.projects, "readonly", (store) =>
    store.get(id),
  );
  return result ?? null;
}

export async function listProjectsFromIndexedDB(): Promise<StoredProject[]> {
  return tx<StoredProject[]>(STORES.projects, "readonly", (store) => store.getAll());
}

export async function deleteProjectFromIndexedDB(id: string): Promise<void> {
  await tx(STORES.projects, "readwrite", (store) => store.delete(id));
}

export async function autosaveWorld(
  projectId: string,
  world: CraftyPlayWorldExport,
  fileHandleKey?: string,
): Promise<void> {
  const record: StoredProject = {
    id: projectId,
    name: world.meta.name,
    world,
    updatedAt: new Date().toISOString(),
    fileHandleKey,
  };
  await saveProjectToIndexedDB(record);
}

export async function getLastOpenedProjectId(): Promise<string | null> {
  const record = await tx<{ key: string; value: string } | undefined>(
    STORES.settings,
    "readonly",
    (store) => store.get("lastOpenedProjectId"),
  );
  return record?.value ?? null;
}

export async function setLastOpenedProjectId(id: string): Promise<void> {
  await tx(STORES.settings, "readwrite", (store) =>
    store.put({ key: "lastOpenedProjectId", value: id }),
  );
}

export async function storeFileHandle(
  key: string,
  name: string,
  handle: FileSystemFileHandle,
): Promise<void> {
  const record: StoredFileHandle = {
    key,
    name,
    handle,
    lastAccessedAt: new Date().toISOString(),
  };
  await tx(STORES.fileHandles, "readwrite", (store) => store.put(record));
}

export async function retrieveFileHandle(
  key: string,
): Promise<FileSystemFileHandle | null> {
  const record = await tx<StoredFileHandle | undefined>(
    STORES.fileHandles,
    "readonly",
    (store) => store.get(key),
  );
  return record?.handle ?? null;
}
