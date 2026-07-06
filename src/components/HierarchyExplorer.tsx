import { useWorld } from "@/context/WorldContext";
import type { WorldObject } from "@/types/world";
import { buildObjectTree } from "@/utils/world";
import { useCallback, useState, type DragEvent } from "react";

const TYPE_ICONS: Record<WorldObject["type"], string> = {
  Model: "📦",
  Part: "🧊",
  Spawn: "🚩",
  Script: "📜",
  Light: "💡",
  Decal: "🖼️",
};

interface TreeNodeProps {
  object: WorldObject;
  depth: number;
  allObjects: WorldObject[];
  selectedId: string | null;
  dragId: string | null;
  dropTargetId: string | null;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (targetId: string) => void;
  onDragOver: (id: string | null) => void;
}

function TreeNode({
  object,
  depth,
  allObjects,
  selectedId,
  dragId,
  dropTargetId,
  onSelect,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
}: TreeNodeProps) {
  const children = buildObjectTree(allObjects, object.id);
  const isSelected = selectedId === object.id;
  const isDragging = dragId === object.id;
  const isDropTarget = dropTargetId === object.id && dragId !== object.id;

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", object.id);
    onDragStart(object.id);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver(object.id);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    onDrop(object.id);
  };

  return (
    <div>
      <button
        type="button"
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => onSelect(object.id)}
        className={[
          "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          isSelected
            ? "bg-accent-500/20 text-accent-400"
            : "text-surface-300 hover:bg-surface-800 hover:text-surface-100",
          isDragging ? "opacity-40" : "",
          isDropTarget ? "ring-1 ring-accent-400 ring-inset" : "",
        ].join(" ")}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="text-xs opacity-70">{TYPE_ICONS[object.type]}</span>
        <span className="truncate font-medium">{object.name}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-surface-500 opacity-0 transition-opacity group-hover:opacity-100">
          {object.type}
        </span>
      </button>
      {children.map((child) => (
        <TreeNode
          key={child.id}
          object={child}
          depth={depth + 1}
          allObjects={allObjects}
          selectedId={selectedId}
          dragId={dragId}
          dropTargetId={dropTargetId}
          onSelect={onSelect}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
          onDragOver={onDragOver}
        />
      ))}
    </div>
  );
}

export function HierarchyExplorer() {
  const { world, editor, selectObject, reparentObject } = useWorld();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const roots = buildObjectTree(world.objects, null);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (dragId) reparentObject(dragId, targetId);
      setDragId(null);
      setDropTargetId(null);
    },
    [dragId, reparentObject],
  );

  return (
    <aside className="flex h-full flex-col border-r border-surface-800 bg-surface-900">
      <header className="flex items-center justify-between border-b border-surface-800 px-3 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
          Explorer
        </h2>
        <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[10px] text-surface-500">
          {world.objects.length}
        </span>
      </header>
      <div className="flex-1 overflow-y-auto p-2">
        {roots.map((root) => (
          <TreeNode
            key={root.id}
            object={root}
            depth={0}
            allObjects={world.objects}
            selectedId={editor.selectedId}
            dragId={dragId}
            dropTargetId={dropTargetId}
            onSelect={selectObject}
            onDragStart={setDragId}
            onDragEnd={() => {
              setDragId(null);
              setDropTargetId(null);
            }}
            onDrop={handleDrop}
            onDragOver={setDropTargetId}
          />
        ))}
      </div>
      <footer className="border-t border-surface-800 px-3 py-2 text-[10px] text-surface-500">
        ドラッグで親子関係を変更
      </footer>
    </aside>
  );
}
