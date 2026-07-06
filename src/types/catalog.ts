import type { CraftyPlayWorldExport } from "@/types/world";

export interface PublishedWorld {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  thumbnail: string;
  plays: number;
  likes: number;
  tags: string[];
  world: CraftyPlayWorldExport;
  publishedAt: string;
  featured?: boolean;
}

export interface PlayHistoryEntry {
  id: string;
  worldId: string;
  playedAt: string;
}
