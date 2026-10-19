import { createServerFn } from '@tanstack/react-start';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { IssueCard, IssueDetail, IssueLink } from './newsletter';

function publicClient() {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('The newsletter is temporarily unavailable.');
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers); if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
}

async function readIssues(client: SupabaseClient<Database>, slug?: string): Promise<IssueCard[]> {
  const rows: IssueCard[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = client.from('newsletter_issues').select('id,slug,title,summary,issue_number,sent_on').eq('status', 'published').order('id');
    if (slug) query = query.eq('slug', slug);
    const { data, error } = await query.range(offset, offset + 999);
    if (error) throw new Error('Newsletter issues could not be loaded.');
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export const getNewsletterIssues = createServerFn({ method: 'GET' }).handler(async (): Promise<{ issues: IssueCard[] }> => {
  return { issues: await readIssues(publicClient()) };
});

const LINK_TABLES: Record<string, { table: 'organisations' | 'events' | 'opportunities' | 'episodes'; title: string; summary: string }> = {
  organisation: { table: 'organisations', title: 'name', summary: 'short_description' },
  event: { table: 'events', title: 'title', summary: 'summary' },
  opportunity: { table: 'opportunities', title: 'title', summary: 'summary' },
  episode: { table: 'episodes', title: 'title', summary: 'summary' },
};

export const getNewsletterIssue = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<IssueDetail | null> => {
    const client = publicClient();
    const [issue] = await readIssues(client, slug);
    if (!issue) return null;
    const { data: row, error } = await client.from('newsletter_issues').select('body,web_url').eq('id', issue.id).eq('status', 'published').maybeSingle();
    if (error) throw new Error('This issue could not be loaded.');
    const { data: rawLinks, error: linkError } = await client.from('newsletter_issue_links').select('id,entry_kind,entry_id,sort_order').eq('newsletter_issue_id', issue.id).order('sort_order');
    if (linkError) throw new Error('The issue links could not be loaded.');
    const links: IssueLink[] = [];
    for (const [kind, cfg] of Object.entries(LINK_TABLES)) {
      const ids = (rawLinks ?? []).filter((link) => link.entry_kind === kind).map((link) => link.entry_id);
      if (!ids.length) continue;
      let rows: Record<string, string | null>[];
      if (kind === 'organisation') {
        // Masking RPC: returns only published organisations.
        const { data, error: rpcError } = await client.rpc('public_organisations');
        if (rpcError) throw new Error('The issue links could not be loaded.');
        rows = (data ?? []).filter((entry) => ids.includes(entry.id));
      } else {
        const { data, error: readError } = await client.from(cfg.table).select(`id,slug,${cfg.title},${cfg.summary}`).eq('status', 'published').in('id', ids);
        if (readError) throw new Error('The issue links could not be loaded.');
        rows = (data ?? []) as unknown as Record<string, string | null>[];
      }
      for (const entry of rows) {
        const link = (rawLinks ?? []).find((item) => item.entry_id === entry['id']);
        links.push({ id: String(entry['id']), kind, slug: String(entry['slug']), title: String(entry[cfg.title] ?? ''), summary: entry[cfg.summary] ?? null, ...(link ? {} : {}) });
      }
    }
    const order = new Map((rawLinks ?? []).map((link) => [link.entry_id, link.sort_order]));
    links.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return { ...issue, body: row?.body ?? null, web_url: row?.web_url ?? null, links };
  });
