import type { CraftyPlayWorldExport } from "@/types/world";

/** IndexedDB に保存するプロジェクトレコード */
export interface StoredProject {
  id: string;
  name: string;
  world: CraftyPlayWorldExport;
  updatedAt: string;
  /** File System Access API で開いたファイルがある場合の参照キー */
  fileHandleKey?: string;
}

/** 永続化されたファイルハンドル参照 */
export interface StoredFileHandle {
  key: string;
  name: string;
  handle: FileSystemFileHandle;
  lastAccessedAt: string;
}

export interface ProjectDocument {
  world: CraftyPlayWorldExport;
  /** ブラウザ内で開いているファイル名（未保存時は null） */
  fileName: string | null;
  /** File System Access API ハンドル（対応ブラウザのみ） */
  fileHandle: FileSystemFileHandle | null;
  /** IndexedDB 上のプロジェクト ID */
  projectId: string;
  source: "indexeddb" | "filesystem" | "network" | "new";
}

export type StorageCapability = {
  indexedDB: boolean;
  fileSystemAccess: boolean;
  showSaveFilePicker: boolean;
};
