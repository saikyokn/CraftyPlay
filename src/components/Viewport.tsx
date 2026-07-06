import { useWorld } from "@/context/WorldContext";

export function Viewport() {
  const { editor, engineReady, wasmLoaded } = useWorld();
  const isPreview = editor.mode === "preview";

  return (
    <div className="relative flex-1 overflow-hidden bg-surface-950">
      {/* WASM キャンバスがマウントされる領域 */}
      <canvas
        id="craftyplay-viewport"
        className="absolute inset-0 h-full w-full"
        aria-label="3D Viewport"
      />

      {/* プロトタイプ用プレースホルダー */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div
            className={[
              "mx-auto mb-4 flex size-24 items-center justify-center rounded-2xl border-2 border-dashed transition-colors",
              engineReady ? "border-accent-500/40 bg-accent-500/5" : "border-surface-700",
            ].join(" ")}
          >
            <span className="text-3xl">{isPreview ? "▶" : "🎮"}</span>
          </div>
          <p className="text-sm font-medium text-surface-400">
            {isPreview ? "Preview Mode" : "Edit Mode"}
          </p>
          <p className="mt-1 text-xs text-surface-600">
            {wasmLoaded ? "WASM → #craftyplay-viewport" : "Mock engine (add public/wasm/craftyplay.wasm)"}
          </p>
        </div>
      </div>

      {/* ビューポートオーバーレイ UI */}
      <div className="absolute bottom-3 left-3 flex gap-1 rounded-lg border border-surface-800 bg-surface-900/90 p-1 backdrop-blur-sm">
        {["Select", "Move", "Rotate", "Scale"].map((tool, i) => (
          <button
            key={tool}
            type="button"
            className={[
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              i === 0
                ? "bg-accent-500 text-white"
                : "text-surface-400 hover:bg-surface-800 hover:text-surface-200",
            ].join(" ")}
          >
            {tool}
          </button>
        ))}
      </div>

      {isPreview && (
        <div className="absolute right-3 top-3 rounded-md bg-danger-500/90 px-2 py-1 text-xs font-semibold text-white">
          LIVE PREVIEW
        </div>
      )}
    </div>
  );
}
