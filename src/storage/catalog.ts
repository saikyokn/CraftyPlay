import type { PlayHistoryEntry, PublishedWorld } from "@/types/catalog";
import {
  platformGet,
  platformGetAll,
  platformPut,
  seedCatalogIfEmpty,
} from "@/storage/platformDb";

export async function loadCatalog(): Promise<PublishedWorld[]> {
  await seedCatalogIfEmpty();
  const worlds = await platformGetAll<PublishedWorld>("worlds");
  return worlds.sort((a, b) => b.plays - a.plays);
}

export async function getWorldById(id: string): Promise<PublishedWorld | null> {
  return platformGet<PublishedWorld>("worlds", id);
}

export async function publishWorld(world: PublishedWorld): Promise<void> {
  await platformPut("worlds", world);
}

export async function recordPlay(worldId: string): Promise<void> {
  const world = await getWorldById(worldId);
  if (world) {
    await platformPut("worlds", { ...world, plays: world.plays + 1 });
  }
  const entry: PlayHistoryEntry = {
    id: worldId,
    worldId,
    playedAt: new Date().toISOString(),
  };
  await platformPut("playHistory", entry);
}

export async function getRecentPlayHistory(): Promise<PlayHistoryEntry[]> {
  const entries = await platformGetAll<PlayHistoryEntry>("playHistory");
  return entries.sort((a, b) => b.playedAt.localeCompare(a.playedAt)).slice(0, 8);
}

export async function likeWorld(worldId: string): Promise<void> {
  const world = await getWorldById(worldId);
  if (world) {
    await platformPut("worlds", { ...world, likes: world.likes + 1 });
  }
}
