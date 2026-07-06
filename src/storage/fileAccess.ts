import type { ProjectDocument } from "@/types/storage";
import type { CraftyPlayWorldExport } from "@/types/world";
import { exportWorldToJson } from "@/utils/world";
import { detectStorageCapabilities } from "@/storage/capabilities";
import { storeFileHandle } from "@/storage/indexeddb";

const WORLD_MIME = "application/vnd.craftyplay.world+json";
const WORLD_EXT = ".craftyplay.json";

export function parseWorldJson(text: string): CraftyPlayWorldExport {
  const data = JSON.parse(text) as CraftyPlayWorldExport;
  if (data.version !== "1.0.0") {
    throw new Error(`Unsupported world version: ${data.version}`);
  }
  return data;
}

async function readFileHandle(handle: FileSystemFileHandle): Promise<CraftyPlayWorldExport> {
  const file = await handle.getFile();
  const text = await file.text();
  return parseWorldJson(text);
}

async function writeFileHandle(
  handle: FileSystemFileHandle,
  world: CraftyPlayWorldExport,
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(exportWorldToJson(world));
  await writable.close();
}

/** File System Access API でワールドを開く */
export async function openWorldFromFilePicker(): Promise<ProjectDocument> {
  const caps = detectStorageCapabilities();
  if (!caps.fileSystemAccess) {
    return openWorldFromInputFallback();
  }

  const [handle] = await window.showOpenFilePicker({
    types: [
      {
        description: "CraftyPlay World",
        accept: { [WORLD_MIME]: [WORLD_EXT, ".json"] },
      },
    ],
    multiple: false,
  });

  const world = await readFileHandle(handle);
  const projectId = crypto.randomUUID();
  const fileHandleKey = `file:${projectId}`;
  await storeFileHandle(fileHandleKey, handle.name, handle);

  return {
    world,
    fileName: handle.name,
    fileHandle: handle,
    projectId,
    source: "filesystem",
  };
}

/** File System Access API で上書き保存 */
export async function saveWorldToFile(
  doc: ProjectDocument,
  world: CraftyPlayWorldExport,
): Promise<ProjectDocument> {
  if (doc.fileHandle) {
    const permission = await doc.fileHandle.requestPermission({ mode: "readwrite" });
    if (permission === "granted") {
      await writeFileHandle(doc.fileHandle, world);
      return { ...doc, world };
    }
  }
  return saveWorldAsFile(world, doc);
}

/** 名前を付けて保存 */
export async function saveWorldAsFile(
  world: CraftyPlayWorldExport,
  doc?: Partial<ProjectDocument>,
): Promise<ProjectDocument> {
  const caps = detectStorageCapabilities();
  const defaultName = `${world.meta.name.replace(/\s+/g, "_")}${WORLD_EXT}`;

  if (caps.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: doc?.fileName ?? defaultName,
      types: [
        {
          description: "CraftyPlay World",
          accept: { [WORLD_MIME]: [WORLD_EXT] },
        },
      ],
    });
    await writeFileHandle(handle, world);
    const projectId = doc?.projectId ?? crypto.randomUUID();
    const fileHandleKey = `file:${projectId}`;
    await storeFileHandle(fileHandleKey, handle.name, handle);

    return {
      world,
      fileName: handle.name,
      fileHandle: handle,
      projectId,
      source: "filesystem",
    };
  }

  downloadWorldBlob(world, defaultName);
  return {
    world,
    fileName: defaultName,
    fileHandle: null,
    projectId: doc?.projectId ?? crypto.randomUUID(),
    source: "indexeddb",
  };
}

/** 非対応ブラウザ向け: <input type="file"> フォールバック */
export function openWorldFromInputFallback(): Promise<ProjectDocument> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = `${WORLD_MIME},.json,application/json`;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }
      try {
        const world = parseWorldJson(await file.text());
        resolve({
          world,
          fileName: file.name,
          fileHandle: null,
          projectId: crypto.randomUUID(),
          source: "indexeddb",
        });
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}

/** ダウンロードリンクによるエクスポート（全ブラウザ対応） */
export function downloadWorldBlob(
  world: CraftyPlayWorldExport,
  filename: string,
): void {
  const blob = new Blob([exportWorldToJson(world)], { type: WORLD_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
