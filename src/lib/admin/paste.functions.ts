import { createServerFn } from '@tanstack/react-start';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { PASTE_COLUMNS, displayOld, parsePasteValue, pasteInputSchema, type PastePreview } from './paste';
import type { ImportEntity } from './csv-import';

async function admin(client: SupabaseClient, userId: string) {
  const { data, error } = await client.rpc('has_role', { _user_id: userId, _role: 'admin' });
  if (error || data !== true) throw new Error('Admin access required.');
}

type Existing = { id: string; slug: string } & Record<string, unknown>;

async function loadBySlug(client: SupabaseClient, entity: ImportEntity, slugs: string[]): Promise<Map<string, Existing>> {
  const map = new Map<string, Existing>();
  for (let i = 0; i < slugs.length; i += 100) {
    const { data, error } = await client.from(entity).select(`id, ${PASTE_COLUMNS[entity].join(', ')}`).in('slug', slugs.slice(i, i + 100));
    if (error) throw new Error('Could not load existing entries.');
    for (const row of (data ?? []) as unknown as Existing[]) map.set(String(row.slug), row);
  }
  return map;
}

function buildPreview(entity: ImportEntity, rows: { number: number; values: Record<string, string> }[], existing: Map<string, Existing>): PastePreview[] {
  return rows.map(({ number, values }) => {
    const slug = (values['slug'] ?? '').trim().toLowerCase();
    const preview: PastePreview = { number, slug, name: '', id: null, changes: [], errors: [] };
    if (!slug) { preview.errors.push('Missing slug'); return preview; }
    const row = existing.get(slug);
    if (!row) { preview.errors.push(`No ${entity.slice(0, -1)} with this slug`); return preview; }
    preview.id = row.id;
    preview.name = String(row[entity === 'organisations' ? 'name' : 'title'] ?? slug);
    for (const column of PASTE_COLUMNS[entity]) {
      if (column === 'slug') continue;
      const raw = values[column];
      if (raw === undefined || !raw.trim()) continue; // empty cells never clear existing values
      const parsed = parsePasteValue(entity, column, raw);
      if (parsed.error) { preview.errors.push(parsed.error); continue; }
      if (parsed.value === undefined) continue;
      preview.changes.push({ column, old: displayOld(row[column]), value: parsed.value });
    }
    return preview;
  });
}

export const previewPasteRows = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(pasteInputSchema)
  .handler(async ({ data, context }) => {
    await admin(context.supabase, context.userId);
    const slugs = [...new Set(data.rows.map(r => (r.values['slug'] ?? '').trim().toLowerCase()).filter(Boolean))];
    const existing = await loadBySlug(context.supabase, data.entity, slugs);
    return buildPreview(data.entity, data.rows, existing);
  });

export const applyPasteRows = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(pasteInputSchema)
  .handler(async ({ data, context }) => {
    await admin(context.supabase, context.userId);
    const slugs = [...new Set(data.rows.map(r => (r.values['slug'] ?? '').trim().toLowerCase()).filter(Boolean))];
    const existing = await loadBySlug(context.supabase, data.entity, slugs);
    const previews = buildPreview(data.entity, data.rows, existing);
    const summary = { updated: 0, skipped: 0, errors: [] as { row: number; message: string }[] };
    for (const preview of previews) {
      if (preview.errors.length || !preview.id) { summary.errors.push({ row: preview.number, message: preview.errors.join('; ') || 'Not found' }); continue; }
      if (!preview.changes.length) { summary.skipped++; continue; }
      const update = Object.fromEntries(preview.changes.map(c => [c.column, c.value]));
      const { error } = await context.supabase.from(data.entity).update(update as never).eq('id', preview.id);
      if (error) { summary.errors.push({ row: preview.number, message: 'Could not save this row. Check its values and try again.' }); continue; }
      summary.updated++;
    }
    return summary;
  });
