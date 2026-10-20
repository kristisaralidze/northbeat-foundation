import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';

const DAY = 86_400_000;
const TASKS = { research: 7, trials: 7, registry: 30, news: 1, geocode: 0 } as const;
type Task = keyof typeof TASKS;

/** Each call refreshes a small, stale-first batch so it finishes inside the scheduler's time limit. */
export const Route = createFileRoute('/api/public/jobs/enrich')({
  server: { handlers: { POST: async ({ request }) => {
    const authFailure = await authenticateCronRequest(request);
    if (authFailure) return authFailure;
    const body = (await request.json().catch(() => ({}))) as { task?: string };
    const task = body.task as Task;
    if (!(task in TASKS)) return Response.json({ error: 'Unknown task' }, { status: 400 });
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const s = await import('@/lib/enrich.server');
    const cutoff = new Date(Date.now() - TASKS[task] * DAY + 3_600_000).toISOString();
    let done = 0; const errors: string[] = [];
    const run = async (label: string, fn: () => Promise<void>) => { try { await fn(); done++; } catch (e) { errors.push(`${label}: ${e instanceof Error ? e.message : 'failed'}`); } };

    if (task === 'research') {
      const { data } = await db.from('organisations').select('id,openalex_id').not('openalex_id', 'is', null).or(`research_fetched_at.is.null,research_fetched_at.lt.${cutoff}`).order('research_fetched_at', { nullsFirst: true }).limit(8);
      await Promise.all((data ?? []).map(r => run(r.id, () => s.refreshResearch(db, r.id, r.openalex_id!))));
    } else if (task === 'trials') {
      const { data: linked } = await db.from('organisation_trials').select('organisation_id').limit(1000);
      const ids = [...new Set((linked ?? []).map(r => r.organisation_id))];
      if (ids.length) {
        const { data } = await db.from('organisations').select('id').in('id', ids).or(`trials_fetched_at.is.null,trials_fetched_at.lt.${cutoff}`).order('trials_fetched_at', { nullsFirst: true }).limit(5);
        await Promise.all((data ?? []).map(r => run(r.id, () => s.refreshTrials(db, r.id))));
      }
    } else if (task === 'registry') {
      const { data } = await db.from('organisations').select('id,business_id').not('business_id', 'is', null).or(`registry_fetched_at.is.null,registry_fetched_at.lt.${cutoff}`).order('registry_fetched_at', { nullsFirst: true }).limit(8);
      await Promise.all((data ?? []).map(r => run(r.id, () => s.refreshRegistry(db, r.id, r.business_id!))));
    } else if (task === 'news') {
      const { data } = await db.from('organisations').select('id,news_feed_url,website').not('news_feed_url', 'is', null).or(`news_fetched_at.is.null,news_fetched_at.lt.${cutoff}`).order('news_fetched_at', { nullsFirst: true }).limit(8);
      await Promise.all((data ?? []).map(r => run(r.id, () => s.refreshNews(db, r.id, r.news_feed_url!, r.website))));
    } else {
      // Nominatim policy: at most one request per second, results cached in the row.
      const ev = await db.from('events').select('id,venue,city,format').is('geocoded_at', null).is('latitude', null).neq('format', 'online').not('city', 'is', null).limit(2);
      const org = await db.from('organisations').select('id,city').is('geocoded_at', null).is('latitude', null).not('city', 'is', null).limit(2);
      const jobs = [...(ev.data ?? []).map(r => ({ table: 'events' as const, id: r.id, queries: [[r.venue, r.city].filter(Boolean).join(', '), r.city!] })), ...(org.data ?? []).map(r => ({ table: 'organisations' as const, id: r.id, queries: [r.city!] }))].slice(0, 3);
      let first = true;
      for (const job of jobs) await run(job.id, async () => {
        let point: [number, number] | null = null;
        for (const q of [...new Set(job.queries)]) { if (!first) await new Promise(r => setTimeout(r, 1100)); first = false; point = await s.geocode(q); if (point) break; }
        await db.from(job.table).update({ latitude: point?.[0] ?? null, longitude: point?.[1] ?? null, geocoded_at: new Date().toISOString() }).eq('id', job.id).is('latitude', null);
      });
    }
    return Response.json({ task, done, errors });
  } } },
});
