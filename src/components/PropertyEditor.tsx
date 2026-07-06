import { useWorld } from "@/context/WorldContext";
import type { Vec3 } from "@/types/world";

function Vec3Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Vec3;
  onChange: (v: Vec3) => void;
}) {
  const axes = (["x", "y", "z"] as const).map((axis) => (
    <label key={axis} className="flex flex-1 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase text-surface-500">{axis}</span>
      <input
        type="number"
        step="0.1"
        value={value[axis]}
        onChange={(e) =>
          onChange({ ...value, [axis]: parseFloat(e.target.value) || 0 })
        }
        className="w-full rounded-md border border-surface-700 bg-surface-850 px-2 py-1.5 text-sm text-surface-100 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
      />
    </label>
  ));

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium text-surface-400">{label}</legend>
      <div className="flex gap-2">{axes}</div>
    </fieldset>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-b border-surface-800 px-3 py-3 last:border-b-0">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function PropertyEditor() {
  const { selectedObject, updateObject } = useWorld();

  if (!selectedObject) {
    return (
      <aside className="flex h-full flex-col border-l border-surface-800 bg-surface-900">
        <header className="border-b border-surface-800 px-3 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            Properties
          </h2>
        </header>
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-surface-500">
          オブジェクトを選択して
          <br />
          プロパティを編集
        </div>
      </aside>
    );
  }

  const { transform, appearance } = selectedObject;

  return (
    <aside className="flex h-full flex-col border-l border-surface-800 bg-surface-900">
      <header className="border-b border-surface-800 px-3 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
          Properties
        </h2>
        <p className="mt-0.5 truncate text-sm font-medium text-surface-100">
          {selectedObject.name}
        </p>
      </header>
      <div className="flex-1 overflow-y-auto">
        <Section title="General">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase text-surface-500">Name</span>
            <input
              type="text"
              value={selectedObject.name}
              onChange={(e) =>
                updateObject(selectedObject.id, { name: e.target.value })
              }
              className="rounded-md border border-surface-700 bg-surface-850 px-2 py-1.5 text-sm outline-none focus:border-accent-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-xs text-surface-400">Visible</span>
            <input
              type="checkbox"
              checked={selectedObject.visible ?? true}
              onChange={(e) =>
                updateObject(selectedObject.id, { visible: e.target.checked })
              }
              className="size-4 rounded border-surface-600 accent-accent-500"
            />
          </label>
        </Section>

        <Section title="Transform">
          <Vec3Input
            label="Position"
            value={transform.position}
            onChange={(position) =>
              updateObject(selectedObject.id, {
                transform: { ...transform, position },
              })
            }
          />
          <Vec3Input
            label="Rotation"
            value={transform.rotation}
            onChange={(rotation) =>
              updateObject(selectedObject.id, {
                transform: { ...transform, rotation },
              })
            }
          />
          <Vec3Input
            label="Scale"
            value={transform.scale}
            onChange={(scale) =>
              updateObject(selectedObject.id, {
                transform: { ...transform, scale },
              })
            }
          />
        </Section>

        {appearance && (
          <Section title="Appearance">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase text-surface-500">
                Color
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={appearance.color ?? "#6366f1"}
                  onChange={(e) =>
                    updateObject(selectedObject.id, {
                      appearance: { ...appearance, color: e.target.value },
                    })
                  }
                  className="size-9 cursor-pointer rounded border border-surface-700 bg-transparent"
                />
                <input
                  type="text"
                  value={appearance.color ?? "#6366f1"}
                  onChange={(e) =>
                    updateObject(selectedObject.id, {
                      appearance: { ...appearance, color: e.target.value },
                    })
                  }
                  className="flex-1 rounded-md border border-surface-700 bg-surface-850 px-2 py-1.5 font-mono text-sm outline-none focus:border-accent-500"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase text-surface-500">
                Material
              </span>
              <select
                value={appearance.material ?? "plastic"}
                onChange={(e) =>
                  updateObject(selectedObject.id, {
                    appearance: {
                      ...appearance,
                      material: e.target.value as NonNullable<
                        typeof appearance.material
                      >,
                    },
                  })
                }
                className="rounded-md border border-surface-700 bg-surface-850 px-2 py-1.5 text-sm outline-none focus:border-accent-500"
              >
                <option value="plastic">Plastic</option>
                <option value="metal">Metal</option>
                <option value="glass">Glass</option>
                <option value="neon">Neon</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase text-surface-500">
                Transparency
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={appearance.transparency ?? 0}
                onChange={(e) =>
                  updateObject(selectedObject.id, {
                    appearance: {
                      ...appearance,
                      transparency: parseFloat(e.target.value),
                    },
                  })
                }
                className="accent-accent-500"
              />
            </label>
          </Section>
        )}
      </div>
    </aside>
  );
}
