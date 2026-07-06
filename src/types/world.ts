/** CraftyPlay ワールドエクスポート JSON スキーマ v1 */

export type Vec3 = { x: number; y: number; z: number };

export type ObjectType =
  | "Part"
  | "Model"
  | "Spawn"
  | "Script"
  | "Light"
  | "Decal";

export interface WorldObject {
  id: string;
  name: string;
  type: ObjectType;
  parentId: string | null;
  transform: {
    position: Vec3;
    rotation: Vec3;
    scale: Vec3;
  };
  appearance?: {
    color?: string;
    material?: "plastic" | "metal" | "glass" | "neon";
    textureId?: string;
    transparency?: number;
  };
  scriptId?: string;
  locked?: boolean;
  visible?: boolean;
}

export interface WorldScript {
  id: string;
  name: string;
  language: "assemblyscript";
  source: string;
  attachedTo: string;
}

export interface WorldTexture {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
}

/** エンジンが読み込むトップレベル JSON */
export interface CraftyPlayWorldExport {
  version: "1.0.0";
  meta: {
    name: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    description?: string;
  };
  settings: {
    gravity: Vec3;
    ambientColor: string;
    skyboxId?: string;
  };
  objects: WorldObject[];
  scripts: WorldScript[];
  textures: WorldTexture[];
}

export interface EditorState {
  selectedId: string | null;
  activeScriptId: string | null;
  mode: "edit" | "preview";
  isDirty: boolean;
  /** 表示用ファイル名 */
  fileName: string | null;
  /** 最終保存 / 自動保存時刻 */
  lastSavedAt: string | null;
}

export type EngineEvent =
  | { type: "object:selected"; id: string }
  | { type: "object:transformed"; id: string; transform: WorldObject["transform"] }
  | { type: "scene:ready" }
  | { type: "preview:started" }
  | { type: "preview:stopped" };

export type EditorCommand =
  | { cmd: "loadWorld"; payload: CraftyPlayWorldExport }
  | { cmd: "selectObject"; id: string | null }
  | { cmd: "updateObject"; object: WorldObject }
  | { cmd: "reparentObject"; id: string; newParentId: string | null }
  | { cmd: "createObject"; object: WorldObject }
  | { cmd: "deleteObject"; id: string }
  | { cmd: "startPreview" }
  | { cmd: "stopPreview" };
