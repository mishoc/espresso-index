/** Metadata for every static data snapshot in /public/data. The "data as
 *  of" stamp on /data pages MUST come from here (the dataset's own
 *  last_synced / vintage), never from the page build date (CLAUDE.md). */
export interface DatasetMeta {
  id: string;
  name: string;
  source_org: string;
  url: string;
  license: string;
  /** The source's own data vintage/version where it exposes one. */
  source_version: string;
  coverage: string;
  update_frequency: string;
  /** ISO date we last fetched it. */
  last_synced: string;
  /** Plain-language methodology note shown under every chart. */
  methodology: string;
}

export const STALE_AFTER_DAYS = 120;

export function isStale(meta: DatasetMeta, now = new Date()): boolean {
  const age = (now.getTime() - new Date(meta.last_synced).getTime()) / 86_400_000;
  return age > STALE_AFTER_DAYS;
}
