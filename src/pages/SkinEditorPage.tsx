import { useState } from "react";
import { Link } from "react-router-dom";
import { AvatarPreview } from "@/components/avatar/AvatarPreview";
import { useAuth } from "@/context/AuthContext";
import {
  ACCESSORY_OPTIONS,
  BODY_PART_LABELS,
  createDefaultSkin,
  type BodyPart,
} from "@/types/skin";

const COLOR_PRESETS = [
  "#f5d0a9", "#6366f1", "#ec4899", "#22c55e", "#f59e0b",
  "#ef4444", "#334155", "#1e293b", "#ffffff", "#000000",
];

type AccessorySlot = keyof typeof ACCESSORY_OPTIONS;

export function SkinEditorPage() {
  const { user, skin, updateSkin } = useAuth();
  const [activePart, setActivePart] = useState<BodyPart>("torso");
  const [activeAccessory, setActiveAccessory] = useState<AccessorySlot>("hat");
  const [saved, setSaved] = useState(false);

  const currentSkin = skin ?? createDefaultSkin(user?.id ?? "guest", "Preview");

  const handleColorChange = async (color: string) => {
    if (!skin) return;
    await updateSkin({
      colors: { ...skin.colors, [activePart]: color },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAccessoryChange = async (slot: AccessorySlot, id: string | null) => {
    if (!skin) return;
    await updateSkin({
      accessories: { ...skin.accessories, [slot]: id },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg text-surface-300">アバターをカスタマイズするにはログインが必要です</p>
        <Link
          to="/auth"
          className="rounded-lg bg-accent-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-600"
        >
          Sign In / Create Account
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Preview panel */}
      <section className="flex w-80 shrink-0 flex-col border-r border-surface-800 bg-surface-900">
        <header className="border-b border-surface-800 px-4 py-3">
          <h1 className="text-sm font-semibold text-surface-200">Avatar Editor</h1>
          <p className="text-[10px] text-surface-500">Roblox スタイルのスキンカスタマイズ</p>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <div className="rounded-2xl border border-surface-800 bg-surface-850 p-8">
            <AvatarPreview skin={currentSkin} size="lg" />
          </div>
          {saved && (
            <span className="text-xs font-medium text-success-500">✓ Saved to browser</span>
          )}
        </div>
        <div className="border-t border-surface-800 p-4">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase text-surface-500">Outfit Name</span>
            <input
              type="text"
              value={skin?.name ?? ""}
              onChange={(e) => void updateSkin({ name: e.target.value })}
              className="rounded-md border border-surface-700 bg-surface-850 px-2 py-1.5 text-sm outline-none focus:border-accent-500"
            />
          </label>
        </div>
      </section>

      {/* Editor controls */}
      <section className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Body colors */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Body Colors
            </h2>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {(Object.keys(BODY_PART_LABELS) as BodyPart[]).map((part) => (
                <button
                  key={part}
                  type="button"
                  onClick={() => setActivePart(part)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    activePart === part
                      ? "bg-accent-500 text-white"
                      : "bg-surface-800 text-surface-400 hover:text-surface-200",
                  ].join(" ")}
                >
                  {BODY_PART_LABELS[part]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => void handleColorChange(color)}
                  className={[
                    "size-9 rounded-lg border-2 transition-transform hover:scale-110",
                    currentSkin.colors[activePart] === color
                      ? "border-accent-400"
                      : "border-surface-700",
                  ].join(" ")}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <label className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-dashed border-surface-600 text-surface-500 hover:border-accent-500">
                +
                <input
                  type="color"
                  className="sr-only"
                  value={currentSkin.colors[activePart]}
                  onChange={(e) => void handleColorChange(e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* Accessories */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Accessories
            </h2>
            <div className="mb-3 flex gap-1.5">
              {(Object.keys(ACCESSORY_OPTIONS) as AccessorySlot[]).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setActiveAccessory(slot)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    activeAccessory === slot
                      ? "bg-accent-500 text-white"
                      : "bg-surface-800 text-surface-400 hover:text-surface-200",
                  ].join(" ")}
                >
                  {slot}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ACCESSORY_OPTIONS[activeAccessory].map((opt) => (
                <button
                  key={String(opt.id)}
                  type="button"
                  onClick={() => void handleAccessoryChange(activeAccessory, opt.id)}
                  className={[
                    "flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors",
                    currentSkin.accessories[activeAccessory] === opt.id
                      ? "border-accent-500 bg-accent-500/10"
                      : "border-surface-800 bg-surface-900 hover:border-surface-700",
                  ].join(" ")}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-[10px] text-surface-400">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
