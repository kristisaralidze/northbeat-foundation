import type { ListFilters } from "./db";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

export function parseListSearch(s: Record<string, unknown>): ListFilters {
  return { q: str(s.q), type: str(s.type), status: str(s.status), field: str(s.field), country: str(s.country) };
}
