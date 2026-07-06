import type { AvatarSkin } from "@/types/skin";

interface AvatarPreviewProps {
  skin: AvatarSkin;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { scale: 0.5, width: 80 },
  md: { scale: 0.75, width: 120 },
  lg: { scale: 1, width: 160 },
};

export function AvatarPreview({ skin, size = "md", className = "" }: AvatarPreviewProps) {
  const { scale, width } = SIZES[size];
  const { colors, accessories } = skin;

  return (
    <div
      className={`relative flex items-end justify-center ${className}`}
      style={{ width, height: width * 1.4 }}
    >
      <div
        className="relative"
        style={{ transform: `scale(${scale})`, transformOrigin: "bottom center" }}
      >
        {/* Head */}
        <div className="relative mx-auto">
          {accessories.hat && (
            <div className="absolute -top-6 left-1/2 z-10 -translate-x-1/2 text-2xl">
              {accessories.hat === "cap" && "🧢"}
              {accessories.hat === "crown" && "👑"}
              {accessories.hat === "headphones" && "🎧"}
            </div>
          )}
          <div
            className="mx-auto size-14 rounded-lg border-2 border-black/30 shadow-md"
            style={{ backgroundColor: colors.head }}
          />
          {accessories.face && (
            <div className="absolute inset-0 flex items-center justify-center text-xl">
              {accessories.face === "glasses" && "👓"}
              {accessories.face === "mask" && "😷"}
              {accessories.face === "visor" && "🥽"}
            </div>
          )}
        </div>

        {/* Torso + Arms */}
        <div className="relative -mt-1 flex items-start justify-center">
          <div
            className="h-12 w-5 rounded-md border-2 border-black/30"
            style={{ backgroundColor: colors.leftArm }}
          />
          <div className="relative -mx-0.5">
            <div
              className="h-16 w-20 rounded-lg border-2 border-black/30 shadow-md"
              style={{ backgroundColor: colors.torso }}
            />
            {accessories.shirt && (
              <div className="absolute inset-0 flex items-center justify-center text-lg opacity-80">
                {accessories.shirt === "hoodie" && "🧥"}
                {accessories.shirt === "jersey" && "👕"}
                {accessories.shirt === "armor" && "🛡️"}
              </div>
            )}
          </div>
          <div
            className="h-12 w-5 rounded-md border-2 border-black/30"
            style={{ backgroundColor: colors.rightArm }}
          />
        </div>

        {/* Legs */}
        <div className="relative -mt-0.5 flex justify-center gap-1">
          <div
            className="h-14 w-7 rounded-md border-2 border-black/30"
            style={{ backgroundColor: colors.leftLeg }}
          />
          <div
            className="h-14 w-7 rounded-md border-2 border-black/30"
            style={{ backgroundColor: colors.rightLeg }}
          />
          {accessories.pants && (
            <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 text-sm opacity-70">
              {accessories.pants === "jeans" && "👖"}
              {accessories.pants === "shorts" && "🩳"}
              {accessories.pants === "boots" && "🥾"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
