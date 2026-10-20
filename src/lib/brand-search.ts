export const BRAND_SEARCH_MIN = 2;
export const BRAND_SEARCH_DELAY = 300;
export type BrandSuggestion = { name: string; domain: string; logo: string | null };
export function brandSuggestions(value: unknown): BrandSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string,unknown>;
    if (typeof row['name'] !== 'string' || typeof row['domain'] !== 'string' || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(row['domain'])) return [];
    return [{ name:row['name'],domain:row['domain'],logo:typeof row['icon'] === 'string' && row['icon'].startsWith('https://') ? row['icon'] : null }];
  }).slice(0,5);
}