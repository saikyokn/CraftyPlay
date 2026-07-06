import type { PublishedWorld } from "@/types/catalog";

interface WorldCardProps {
  world: PublishedWorld;
  onPlay: (world: PublishedWorld) => void;
  compact?: boolean;
}

export function WorldCard({ world, onPlay, compact }: WorldCardProps) {
  return (
    <article
      className={[
        "group flex flex-col overflow-hidden rounded-xl border border-surface-800 bg-surface-900 transition-all hover:border-accent-500/40 hover:shadow-lg hover:shadow-accent-500/5",
        compact ? "w-44 shrink-0" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => onPlay(world)}
        className="relative aspect-[4/3] w-full overflow-hidden"
      >
        <div className="absolute inset-0" style={{ background: world.thumbnail }} />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/90 via-transparent to-transparent" />
        {world.featured && (
          <span className="absolute left-2 top-2 rounded bg-accent-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Featured
          </span>
        )}
        <div className="absolute bottom-2 left-2 right-2">
          <p className="truncate text-left text-sm font-semibold text-white">{world.title}</p>
          <p className="truncate text-left text-[10px] text-surface-300">by {world.authorName}</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded-full bg-accent-500 px-4 py-2 text-sm font-bold text-white">
            ▶ Play
          </span>
        </div>
      </button>

      {!compact && (
        <div className="flex flex-1 flex-col gap-2 p-3">
          <p className="line-clamp-2 text-xs text-surface-400">{world.description}</p>
          <div className="flex flex-wrap gap-1">
            {world.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-surface-800 px-1.5 py-0.5 text-[10px] text-surface-400"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-3 text-[10px] text-surface-500">
            <span>▶ {world.plays.toLocaleString()}</span>
            <span>♥ {world.likes.toLocaleString()}</span>
          </div>
        </div>
      )}
    </article>
  );
}
