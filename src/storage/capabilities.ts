import type { StorageCapability } from "@/types/storage";

export function detectStorageCapabilities(): StorageCapability {
  return {
    indexedDB: typeof indexedDB !== "undefined",
    fileSystemAccess: typeof window !== "undefined" && "showOpenFilePicker" in window,
    showSaveFilePicker:
      typeof window !== "undefined" && "showSaveFilePicker" in window,
  };
}
