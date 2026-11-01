import type { PageLayout } from "@/widgets/types";

/** Swap implementations to change the storage backend. */
export interface PagePersistence {
  load(pageId: string): Promise<PageLayout | null>;
  save(pageId: string, layout: PageLayout): Promise<void>;
  remove(pageId: string): Promise<void>;
  list(): Promise<Array<{ id: string; name: string }>>;
}
