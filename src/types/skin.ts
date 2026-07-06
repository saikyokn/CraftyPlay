export type BodyPart = "head" | "torso" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

export interface AvatarSkin {
  id: string;
  userId: string;
  name: string;
  colors: Record<BodyPart, string>;
  accessories: {
    hat: string | null;
    face: string | null;
    shirt: string | null;
    pants: string | null;
  };
  updatedAt: string;
}

export const DEFAULT_SKIN_COLORS: Record<BodyPart, string> = {
  head: "#f5d0a9",
  torso: "#6366f1",
  leftArm: "#f5d0a9",
  rightArm: "#f5d0a9",
  leftLeg: "#334155",
  rightLeg: "#334155",
};

export const BODY_PART_LABELS: Record<BodyPart, string> = {
  head: "Head",
  torso: "Torso",
  leftArm: "Left Arm",
  rightArm: "Right Arm",
  leftLeg: "Left Leg",
  rightLeg: "Right Leg",
};

export const ACCESSORY_OPTIONS = {
  hat: [
    { id: null, label: "None", icon: "—" },
    { id: "cap", label: "Cap", icon: "🧢" },
    { id: "crown", label: "Crown", icon: "👑" },
    { id: "headphones", label: "Headphones", icon: "🎧" },
  ],
  face: [
    { id: null, label: "None", icon: "—" },
    { id: "glasses", label: "Glasses", icon: "👓" },
    { id: "mask", label: "Mask", icon: "😷" },
    { id: "visor", label: "Visor", icon: "🥽" },
  ],
  shirt: [
    { id: null, label: "None", icon: "—" },
    { id: "hoodie", label: "Hoodie", icon: "🧥" },
    { id: "jersey", label: "Jersey", icon: "👕" },
    { id: "armor", label: "Armor", icon: "🛡️" },
  ],
  pants: [
    { id: null, label: "None", icon: "—" },
    { id: "jeans", label: "Jeans", icon: "👖" },
    { id: "shorts", label: "Shorts", icon: "🩳" },
    { id: "boots", label: "Boots", icon: "🥾" },
  ],
} as const;

export function createDefaultSkin(userId: string, name = "My Avatar"): AvatarSkin {
  return {
    id: crypto.randomUUID(),
    userId,
    name,
    colors: { ...DEFAULT_SKIN_COLORS },
    accessories: { hat: null, face: null, shirt: null, pants: null },
    updatedAt: new Date().toISOString(),
  };
}
