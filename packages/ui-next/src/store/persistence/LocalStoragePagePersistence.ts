import type { PageLayout } from "@/widgets/types";
import type { PagePersistence } from "./PagePersistence";

const KEY_PREFIX = "layout:";
const INDEX_KEY = "layout:__index__";

type IndexEntry = { id: string; name: string };

function indexKey(): string {
  return INDEX_KEY;
}

function pageKey(pageId: string): string {
  return `${KEY_PREFIX}${pageId}`;
}

function readIndex(): IndexEntry[] {
  try {
    return JSON.parse(localStorage.getItem(indexKey()) ?? "[]") as IndexEntry[];
  } catch {
    return [];
  }
}

function writeIndex(entries: IndexEntry[]): void {
  localStorage.setItem(indexKey(), JSON.stringify(entries));
}

export class LocalStoragePagePersistence implements PagePersistence {
  async load(pageId: string): Promise<PageLayout | null> {
    try {
      const raw = localStorage.getItem(pageKey(pageId));
      if (!raw) return null;
      return JSON.parse(raw) as PageLayout;
    } catch {
      return null;
    }
  }

  async save(pageId: string, layout: PageLayout): Promise<void> {
    localStorage.setItem(pageKey(pageId), JSON.stringify(layout));

    const index = readIndex();
    const existing = index.findIndex((e) => e.id === pageId);
    const entry: IndexEntry = { id: pageId, name: layout.name };
    if (existing >= 0) {
      index[existing] = entry;
    } else {
      index.push(entry);
    }
    writeIndex(index);
  }

  async remove(pageId: string): Promise<void> {
    localStorage.removeItem(pageKey(pageId));
    writeIndex(readIndex().filter((e) => e.id !== pageId));
  }

  async list(): Promise<IndexEntry[]> {
    return readIndex();
  }
}
