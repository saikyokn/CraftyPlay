/**
 * WASM エンジンを静的アセットとしてロード（ビルド成果物と同梱）。
 * Node.js / Electron 不要 — fetch('./wasm/craftyplay.wasm') のみ。
 */

export interface WasmEngineExports {
  memory: WebAssembly.Memory;
  editor_command: (jsonPtr: number, jsonLen: number) => void;
  init_renderer: (canvasSelectorPtr: number, selectorLen: number) => number;
  tick: (deltaMs: number) => void;
}

export interface WasmEngineModule {
  exports: WasmEngineExports;
  ready: boolean;
}

const WASM_PATH = `${import.meta.env.BASE_URL}wasm/craftyplay.wasm`;

let modulePromise: Promise<WasmEngineModule | null> | null = null;

export async function loadWasmEngine(): Promise<WasmEngineModule | null> {
  if (modulePromise) return modulePromise;

  modulePromise = (async () => {
    try {
      const response = await fetch(WASM_PATH);
      if (!response.ok) {
        console.info(
          "[WASM] Engine not bundled yet — using mock bridge. Place craftyplay.wasm in public/wasm/",
        );
        return null;
      }

      const bytes = await response.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(bytes, {
        env: {
          console_log: (ptr: number, len: number) => {
            console.log(readWasmString(instance.exports.memory as WebAssembly.Memory, ptr, len));
          },
        },
      });

      return {
        exports: instance.exports as unknown as WasmEngineExports,
        ready: true,
      };
    } catch {
      console.info("[WASM] Failed to load — mock bridge active");
      return null;
    }
  })();

  return modulePromise;
}

function readWasmString(memory: WebAssembly.Memory, ptr: number, len: number): string {
  return new TextDecoder().decode(new Uint8Array(memory.buffer, ptr, len));
}

/** WASM 文字列書き込み用ユーティリティ（本番ブリッジで使用） */
export function allocWasmString(
  memory: WebAssembly.Memory,
  alloc: (size: number) => number,
  text: string,
): { ptr: number; len: number } {
  const bytes = new TextEncoder().encode(text);
  const ptr = alloc(bytes.length + 1);
  new Uint8Array(memory.buffer, ptr, bytes.length + 1).set(bytes);
  return { ptr, len: bytes.length };
}
