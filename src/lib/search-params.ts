/** Remove empty/default values so shared URLs only carry params that mean something. */
export function compactSearch<T extends Record<string, unknown>>(search: T, defaults: Partial<T> = {}): T {
  return Object.fromEntries(Object.entries(search).filter(([key, value]) =>
    value !== '' && value !== false && value !== undefined && value !== null &&
    !(Array.isArray(value) && value.length === 0) && defaults[key] !== value)) as T;
}
