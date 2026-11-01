import { apiClient } from '@/lib/db';

/**
 * Filters out pictures that are only in private collections.
 * Uses server API to check collection visibility.
 */
export async function filterPrivateCollectionPictures<T extends { id: string }>(
  pictures: T[]
): Promise<T[]> {
  if (pictures.length === 0) return pictures;
  try {
    const ids = pictures.map(p => p.id).join(',');
    const result = await apiClient<{ publicIds: string[] }>(`/api/collection-pictures/public-filter?ids=${ids}`);
    const publicIds = new Set(result.publicIds);
    return pictures.filter(p => publicIds.has(p.id));
  } catch {
    return pictures;
  }
}


