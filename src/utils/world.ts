import type {
  CraftyPlayWorldExport,
  WorldObject,
  WorldScript,
} from "@/types/world";

export function createDefaultWorld(): CraftyPlayWorldExport {
  const now = new Date().toISOString();
  const workspaceId = crypto.randomUUID();
  const spawnId = crypto.randomUUID();
  const partId = crypto.randomUUID();
  const scriptId = crypto.randomUUID();

  return {
    version: "1.0.0",
    meta: {
      name: "Untitled World",
      author: "Creator",
      createdAt: now,
      updatedAt: now,
    },
    settings: {
      gravity: { x: 0, y: -9.81, z: 0 },
      ambientColor: "#404050",
    },
    objects: [
      {
        id: workspaceId,
        name: "Workspace",
        type: "Model",
        parentId: null,
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        visible: true,
      },
      {
        id: spawnId,
        name: "SpawnPoint",
        type: "Spawn",
        parentId: workspaceId,
        transform: {
          position: { x: 0, y: 3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        visible: true,
      },
      {
        id: partId,
        name: "BasePlate",
        type: "Part",
        parentId: workspaceId,
        transform: {
          position: { x: 0, y: 0.5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 20, y: 1, z: 20 },
        },
        appearance: {
          color: "#4a5568",
          material: "plastic",
        },
        scriptId,
        visible: true,
      },
    ],
    scripts: [
      {
        id: scriptId,
        name: "BasePlateScript",
        language: "assemblyscript",
        attachedTo: partId,
        source: `// AssemblyScript — CraftyPlay UGC Script
export function onStart(): void {
  // ゲーム開始時に呼ばれる
}

export function onUpdate(deltaTime: f32): void {
  // 毎フレーム呼ばれる
}
`,
      },
    ],
    textures: [],
  };
}

export function exportWorldToJson(world: CraftyPlayWorldExport): string {
  const payload: CraftyPlayWorldExport = {
    ...world,
    meta: {
      ...world.meta,
      updatedAt: new Date().toISOString(),
    },
  };
  return JSON.stringify(payload, null, 2);
}

export function buildObjectTree(
  objects: WorldObject[],
  parentId: string | null = null,
): WorldObject[] {
  return objects
    .filter((o) => o.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function wouldCreateCycle(
  objects: WorldObject[],
  childId: string,
  newParentId: string | null,
): boolean {
  if (!newParentId || childId === newParentId) return true;
  let current: string | null = newParentId;
  while (current) {
    if (current === childId) return true;
    current = objects.find((o) => o.id === current)?.parentId ?? null;
  }
  return false;
}

export function findScriptForObject(
  scripts: WorldScript[],
  object: WorldObject,
): WorldScript | undefined {
  if (!object.scriptId) return undefined;
  return scripts.find((s) => s.id === object.scriptId);
}
