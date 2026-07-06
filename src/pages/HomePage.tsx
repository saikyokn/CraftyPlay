import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WorldCard } from "@/components/home/WorldCard";
import { useAuth } from "@/context/AuthContext";
import type { PublishedWorld } from "@/types/catalog";
import { getRecentPlayHistory, loadCatalog, recordPlay } from "@/storage/catalog";
import { platformGet } from "@/storage/platformDb";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [worlds, setWorlds] = useState<PublishedWorld[]>([]);
  const [recent, setRecent] = useState<PublishedWorld[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const catalog = await loadCatalog();
      setWorlds(catalog);

      const history = await getRecentPlayHistory();
      const recentWorlds: PublishedWorld[] = [];
      for (const entry of history) {
        const w = await platformGet<PublishedWorld>("worlds", entry.worldId);
        if (w) recentWorlds.push(w);
      }
      setRecent(recentWorlds);
      setLoading(false);
    })();
  }, []);

  const handlePlay = useCallback(
    async (world: PublishedWorld) => {
      await recordPlay(world.id);
      navigate(`/play/${world.id}`);
    },
    [navigate],
  );

  const featured = worlds.filter((w) => w.featured);
  const filtered = worlds.filter(
    (w) =>
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-surface-500">
        Loading worlds…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero */}
      <section className="relative border-b border-surface-800 bg-gradient-to-br from-accent-600/20 via-surface-900 to-surface-950 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-surface-100">
            {user ? `Welcome back, ${user.displayName}!` : "Explore CraftyPlay"}
          </h1>
          <p className="mt-2 max-w-xl text-surface-400">
            ユーザーが作ったワールドをプレイしよう。Obby、Tycoon、RP — すべてブラウザで。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/create")}
              className="rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600"
            >
              ＋ Create World
            </button>
            <button
              type="button"
              onClick={() => navigate("/avatar")}
              className="rounded-lg border border-surface-700 bg-surface-850 px-5 py-2.5 text-sm font-medium text-surface-200 hover:bg-surface-800"
            >
              Customize Avatar
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {/* Search */}
        <input
          type="search"
          placeholder="Search worlds, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-surface-700 bg-surface-850 px-4 py-2.5 text-sm text-surface-100 outline-none focus:border-accent-500"
        />

        {/* Recently played */}
        {recent.length > 0 && !search && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-surface-200">Recently Played</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recent.map((w) => (
                <WorldCard key={w.id} world={w} onPlay={handlePlay} compact />
              ))}
            </div>
          </section>
        )}

        {/* Featured */}
        {featured.length > 0 && !search && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-surface-200">Featured</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((w) => (
                <WorldCard key={w.id} world={w} onPlay={handlePlay} />
              ))}
            </div>
          </section>
        )}

        {/* All worlds */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-surface-200">
            {search ? `Results (${filtered.length})` : "All Worlds"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((w) => (
              <WorldCard key={w.id} world={w} onPlay={handlePlay} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-surface-500">No worlds found</p>
          )}
        </section>
      </div>
    </div>
  );
}
