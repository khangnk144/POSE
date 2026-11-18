/** One published pose as the suggest route reads it from the database. */
export type CatalogRow = {
  id: string;
  title: string;
  posture: string | null;
  people_count: string | null;
  scenes: string[] | null;
  camera_height: string | null;
};

/** Above this many poses the catalog is narrowed first, to keep the prompt (and cost) bounded. */
export const MAX_CATALOG_POSES = 600;

export type Catalog = {
  /** Compact text block, one pose per line, numbered from 1. */
  text: string;
  /** Number shown to the model -> real pose id. Numbers keep the prompt short (UUIDs cost ~20 tokens). */
  refToPoseId: Map<number, string>;
  total: number;
  truncated: boolean;
};

/**
 * `rows` must be newest first. When there are too many poses, keep those matching the requested
 * people count (poses without a count are kept), then the newest MAX_CATALOG_POSES.
 */
export function buildCatalog(rows: CatalogRow[], peopleCount?: string): Catalog {
  let picked = rows;
  if (picked.length > MAX_CATALOG_POSES && peopleCount) {
    picked = picked.filter((r) => !r.people_count || r.people_count === peopleCount);
  }
  const truncated = picked.length > MAX_CATALOG_POSES;
  if (truncated) picked = picked.slice(0, MAX_CATALOG_POSES);

  const refToPoseId = new Map<number, string>();
  const lines = picked.map((r, i) => {
    const ref = i + 1;
    refToPoseId.set(ref, r.id);
    const parts = [
      r.title.replace(/[|\n]/g, ' ').slice(0, 80),
      r.posture ?? '',
      r.people_count ?? '',
      (r.scenes ?? []).join(','),
      r.camera_height ?? '',
    ];
    return `${ref}|${parts.join('|')}`;
  });

  const header = 'Thư viện dáng (số|tên|tư thế|số người|bối cảnh|độ cao máy):';
  return { text: `${header}\n${lines.join('\n')}`, refToPoseId, total: rows.length, truncated };
}
