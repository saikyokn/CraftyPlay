import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AvatarPreview } from "@/components/avatar/AvatarPreview";
import { useAuth } from "@/context/AuthContext";
import { createDefaultSkin } from "@/types/skin";
import type { PublishedWorld } from "@/types/catalog";
import { getWorldById, likeWorld } from "@/storage/catalog";

export function PlayPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { user, skin } = useAuth();
  const [world, setWorld] = useState<PublishedWorld | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!worldId) return;
    void getWorldById(worldId).then(setWorld);
  }, [worldId]);

  if (!world) {
    return (
      <div className="flex h-full items-center justify-center text-surface-500">
        Loading world…
      </div>
    );
  }

  const avatarSkin = skin ?? createDefaultSkin("guest", "Guest");

  return (
    <div className="relative flex h-full flex-col bg-surface-950">
      {/* Game viewport placeholder */}
      <div className="relative flex-1 overflow-hidden">
        <canvas id="craftyplay-game-viewport" className="absolute inset-0 h-full w-full" />
        <div
          className="absolute inset-0"
          style={{ background: world.thumbnail, opacity: 0.15 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-surface-100">{world.title}</p>
            <p className="mt-1 text-sm text-surface-400">WASM ゲームビュー（接続時にロード）</p>
            <div className="mt-6 flex justify-center">
              <AvatarPreview skin={avatarSkin} size="lg" />
            </div>
          </div>
        </div>

        {/* In-game HUD */}
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-surface-800 bg-surface-900/90 px-3 py-2 backdrop-blur-sm">
          <AvatarPreview skin={avatarSkin} size="sm" />
          <span className="text-sm font-medium text-surface-200">
            {user?.displayName ?? "Guest"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="absolute right-4 top-4 rounded-lg border border-surface-700 bg-surface-900/90 px-4 py-2 text-sm font-medium text-surface-200 backdrop-blur-sm hover:bg-surface-800"
        >
          ✕ Leave
        </button>
      </div>

      {/* Bottom bar */}
      <footer className="flex items-center gap-4 border-t border-surface-800 bg-surface-900 px-4 py-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-200">{world.title}</p>
          <p className="text-xs text-surface-500">by {world.authorName}</p>
        </div>
        <button
          type="button"
          disabled={liked}
          onClick={() => {
            void likeWorld(world.id);
            setLiked(true);
          }}
          className="rounded-lg border border-surface-700 px-3 py-1.5 text-sm text-surface-300 hover:bg-surface-800 disabled:opacity-50"
        >
          ♥ {world.likes + (liked ? 1 : 0)}
        </button>
        <Link
          to="/create"
          className="rounded-lg bg-accent-500/20 px-3 py-1.5 text-sm font-medium text-accent-400 hover:bg-accent-500/30"
        >
          Edit Similar
        </Link>
      </footer>
    </div>
  );
}
