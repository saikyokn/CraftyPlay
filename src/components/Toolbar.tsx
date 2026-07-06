import { useWorld } from "@/context/WorldContext";
import { ConnectionPanel } from "@/components/ConnectionPanel";
import type { WorldObject } from "@/types/world";
import { useState } from "react";

const CREATE_ITEMS: { type: WorldObject["type"]; label: string; icon: string }[] = [
  { type: "Part", label: "Part", icon: "🧊" },
  { type: "Model", label: "Model", icon: "📦" },
  { type: "Spawn", label: "Spawn", icon: "🚩" },
  { type: "Light", label: "Light", icon: "💡" },
  { type: "Decal", label: "Decal", icon: "🖼️" },
];

const TEXTURES = [
  { id: "tex_grass", name: "Grass", preview: "#3d7a3d" },
  { id: "tex_brick", name: "Brick", preview: "#8b4513" },
  { id: "tex_metal", name: "Metal", preview: "#708090" },
  { id: "tex_neon", name: "Neon Grid", preview: "#6366f1" },
];

function ToolbarButton({
  children,
  onClick,
  active,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40",
        active
          ? "bg-accent-500 text-white"
          : "text-surface-300 hover:bg-surface-800 hover:text-surface-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function Toolbar() {
  const {
    editor,
    engineReady,
    wasmLoaded,
    storage,
    createObject,
    setMode,
    openWorld,
    saveWorld,
    saveWorldAs,
    selectedObject,
    updateObject,
  } = useWorld();
  const [showCreate, setShowCreate] = useState(false);
  const [showTextures, setShowTextures] = useState(false);
  const [showFile, setShowFile] = useState(false);

  const isPreview = editor.mode === "preview";

  return (
    <header className="relative z-20 flex h-12 items-center gap-1 border-b border-surface-800 bg-surface-900/95 px-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 pr-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-accent-500 text-xs font-bold text-white">
          CP
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight text-surface-100">
            CraftyPlay
          </span>
          <span className="max-w-[140px] truncate text-[10px] text-surface-500">
            {editor.fileName ?? "Untitled (browser)"}
          </span>
        </div>
        {editor.isDirty && (
          <span className="size-2 rounded-full bg-warning-500" title="未保存の変更" />
        )}
      </div>

      <div className="h-5 w-px bg-surface-700" />

      <div className="relative">
        <ToolbarButton
          title="ファイル操作"
          onClick={() => {
            setShowFile(!showFile);
            setShowCreate(false);
            setShowTextures(false);
          }}
        >
          📁 File
        </ToolbarButton>
        {showFile && (
          <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-surface-700 bg-surface-850 p-1 shadow-xl">
            <button
              type="button"
              onClick={() => {
                void openWorld();
                setShowFile(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-surface-200 hover:bg-surface-800"
            >
              📂 Open
              {!storage.fileSystemAccess && (
                <span className="ml-auto text-[9px] text-surface-500">input</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                void saveWorld();
                setShowFile(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-surface-200 hover:bg-surface-800"
            >
              💾 Save
            </button>
            <button
              type="button"
              onClick={() => {
                void saveWorldAs();
                setShowFile(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-surface-200 hover:bg-surface-800"
            >
              💾 Save As…
            </button>
            <div className="my-1 border-t border-surface-800" />
            <p className="px-2 py-1 text-[9px] text-surface-500">
              {storage.indexedDB
                ? "自動保存: IndexedDB (5s)"
                : "IndexedDB 未対応"}
            </p>
          </div>
        )}
      </div>

      <div className="relative">
        <ToolbarButton
          title="オブジェクトを作成"
          onClick={() => {
            setShowCreate(!showCreate);
            setShowTextures(false);
            setShowFile(false);
          }}
        >
          <span>＋</span> Create
        </ToolbarButton>
        {showCreate && (
          <div className="absolute left-0 top-full mt-1 w-44 rounded-lg border border-surface-700 bg-surface-850 p-1 shadow-xl">
            {CREATE_ITEMS.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  createObject(item.type);
                  setShowCreate(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-surface-200 hover:bg-surface-800"
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <ToolbarButton
          title="テクスチャを選択"
          onClick={() => {
            setShowTextures(!showTextures);
            setShowCreate(false);
            setShowFile(false);
          }}
        >
          🎨 Texture
        </ToolbarButton>
        {showTextures && (
          <div className="absolute left-0 top-full mt-1 w-52 rounded-lg border border-surface-700 bg-surface-850 p-2 shadow-xl">
            <p className="mb-2 px-1 text-[10px] uppercase text-surface-500">
              {selectedObject ? "選択中に適用" : "オブジェクトを選択"}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {TEXTURES.map((tex) => (
                <button
                  key={tex.id}
                  type="button"
                  disabled={!selectedObject?.appearance}
                  onClick={() => {
                    if (selectedObject?.appearance) {
                      updateObject(selectedObject.id, {
                        appearance: {
                          ...selectedObject.appearance,
                          textureId: tex.id,
                        },
                      });
                    }
                    setShowTextures(false);
                  }}
                  className="flex flex-col items-center gap-1 rounded-md p-2 text-xs text-surface-300 hover:bg-surface-800 disabled:opacity-40"
                >
                  <span
                    className="size-8 rounded border border-surface-600"
                    style={{ backgroundColor: tex.preview }}
                  />
                  {tex.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-surface-700" />

      <ToolbarButton
        title={isPreview ? "編集モードに戻る" : "プレビュー開始"}
        active={isPreview}
        onClick={() => setMode(isPreview ? "edit" : "preview")}
      >
        {isPreview ? "⏹ Stop" : "▶ Preview"}
      </ToolbarButton>

      <div className="ml-auto flex items-center gap-2">
        <ConnectionPanel />
        <span
          className={[
            "flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide",
            engineReady ? "text-success-500" : "text-surface-500",
          ].join(" ")}
          title={wasmLoaded ? "WASM engine loaded" : "Mock engine (no WASM)"}
        >
          <span
            className={[
              "size-1.5 rounded-full",
              engineReady ? "bg-success-500 animate-pulse" : "bg-surface-600",
            ].join(" ")}
          />
          {engineReady ? (wasmLoaded ? "WASM" : "Mock") : "…"}
        </span>
        <ToolbarButton title="上書き保存" onClick={() => void saveWorld()}>
          💾
        </ToolbarButton>
      </div>
    </header>
  );
}
