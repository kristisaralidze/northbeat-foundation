import { createServerFn } from '@tanstack/react-start';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { ENTITIES } from './entities';
import { importEntitySchema, importInputSchema, prepareRow, type Snapshot, type ImportEntity } from './csv-import';

async function snapshot(client: SupabaseClient, entity: ImportEntity): Promise<Snapshot> {
  async function all(table: string, columns: string) {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await client.from(table).select(columns).order('id').range(offset, offset + 499);
      if (error) throw new Error('Could not load import matches.');
      const page = (data ?? []) as unknown as Record<string, unknown>[];
      rows.push(...page);
      if (page.length < 500) return rows;
    }
  }
  const cfg = ENTITIES[entity];
  const [entries, organisations, terms] = await Promise.all([
    all(entity, `id, slug, ${cfg.titleField}${entity === 'organisations' ? ', website' : ''}`),
    all('organisations', 'id, name'), all('terms', 'id, kind, name'),
  ]);
  return { entries: entries.map(r => ({ id: String(r['id']), slug: String(r['slug'] ?? ''), name: String(r[cfg.titleField]), website: typeof r['website'] === 'string' ? r['website'] : null })), organisations: organisations as Snapshot['organisations'], terms: terms as Snapshot['terms'] };
}
async function admin(client: SupabaseClient, userId: string) {
  const { data, error } = await client.rpc('has_role', { _user_id: userId, _role: 'admin' });
  if (error || data !== true) throw new Error('Admin access required.');
}
export const getImportMatches = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(importEntitySchema)
  .handler(async ({ data, context }) => {
    await admin(context.supabase, context.userId);
    return snapshot(context.supabase, data);
  });

export const importCsvRows = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(importInputSchema)
  .handler(async ({ data, context }) => {
    await admin(context.supabase, context.userId);
    const matches = await snapshot(context.supabase, data.entity);
    const summary = { added: 0, updated: 0, skipped: 0, errors: [] as { row: number; message: string }[] };
    for (const row of data.rows) {
      const prepared = prepareRow(data.entity, row.values, matches, data.choices, new Date().toISOString().slice(0, 10), data.parents);
      if (prepared.errors.length) { summary.errors.push({ row: row.number, message: prepared.errors.join('; ') }); continue; }
      if (prepared.update) {
        const { error } = await context.supabase.from('organisations').update(prepared.update.values as TablesUpdate<'organisations'>).eq('id', prepared.update.id);
        if (error) summary.errors.push({ row: row.number, message: 'Could not update this row. Check its values and try again.' });
        else summary.updated++;
        continue;
      }
      if (prepared.duplicate) { summary.skipped++; continue; }
      const { data: result, error } = await context.supabase.rpc('admin_import_csv_row', {
        _entity: data.entity, _values: prepared.values, _tags: prepared.tags, ...(prepared.organisationId ? { _organisation_id: prepared.organisationId } : {}),
      });
      if (error) { summary.errors.push({ row: row.number, message: 'Could not save this row. Check its values and try again.' }); continue; }
      const saved = result && typeof result === 'object' && !Array.isArray(result) ? result : null;
      if (saved?.['status'] === 'skipped') summary.skipped++;
      else {
        summary.added++;
        matches.entries.push({ id: String(saved?.['id']), slug: String(prepared.values['slug'] ?? ''), name: prepared.name, website: String(prepared.values['website'] ?? '') });
      }
    }
    return summary;
  });