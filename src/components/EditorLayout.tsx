import { useState } from "react";
import { Toolbar } from "@/components/Toolbar";
import { HierarchyExplorer } from "@/components/HierarchyExplorer";
import { PropertyEditor } from "@/components/PropertyEditor";
import { Viewport } from "@/components/Viewport";
import { CodeEditorPanel } from "@/components/CodeEditor";

export function EditorLayout() {
  const [bottomHeight, setBottomHeight] = useState(220);
  const [leftWidth] = useState(240);
  const [rightWidth] = useState(280);

  return (
    <div className="flex h-screen flex-col">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* 左: 階層エクスプローラー */}
        <div style={{ width: leftWidth }} className="shrink-0">
          <HierarchyExplorer />
        </div>

        {/* 中央: ビューポート + コードエディタ */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 min-h-0">
            <Viewport />
          </div>

          {/* 下部: AssemblyScript エディタ */}
          <div
            className="shrink-0 border-t border-surface-800"
            style={{ height: bottomHeight }}
          >
            <div
              className="group -mt-1 flex h-1 cursor-row-resize items-center justify-center hover:bg-accent-500/30"
              onMouseDown={(e) => {
                const startY = e.clientY;
                const startH = bottomHeight;
                const onMove = (ev: MouseEvent) => {
                  const delta = startY - ev.clientY;
                  setBottomHeight(Math.min(480, Math.max(120, startH + delta)));
                };
                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            >
              <div className="h-0.5 w-8 rounded bg-surface-600 group-hover:bg-accent-400" />
            </div>
            <CodeEditorPanel />
          </div>
        </div>

        {/* 右: プロパティエディタ */}
        <div style={{ width: rightWidth }} className="shrink-0">
          <PropertyEditor />
        </div>
      </div>
    </div>
  );
}
