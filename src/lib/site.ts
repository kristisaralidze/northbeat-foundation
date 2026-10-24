export type Founder = { id: string; name: string; one_line: string | null; photo_url: string | null; linkedin_url: string | null };
export type SiteInfo = { contactEmail: string | null; linkedinUrl: string | null; instagramUrl: string | null; podcastThemes?: string[]; founders: Founder[]; updatedOn: string | null };

/** Newest ISO date (YYYY-MM-DD) among the values, or null when none are valid. */
export function newestDate(values: (string | null | undefined)[]): string | null {
  const valid = values.filter((v): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)).map(v => v.slice(0, 10));
  return valid.length ? valid.sort().at(-1)! : null;
}

/** "24 October 2026" from a YYYY-MM-DD date. */
export function longDate(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y!, m! - 1, d!)));
}

/** Rows as CSV with quoted cells, safe against spreadsheet formula injection. */
export function toCsv(header: string[], rows: (string | null)[][]): string {
  const cell = (v: string | null) => { let s = v ?? ''; if (/^[=+\-@]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
  return [header, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
}

/** Adds a tag once, keeping existing tags. */
export function addTag(tags: string[] | null | undefined, tag: string | undefined): string[] {
  const list = [...(tags ?? [])];
  if (tag && !list.includes(tag)) list.push(tag);
  return list;
}
