import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { PodcastData } from './podcast';

export const getPodcast = createServerFn({ method: 'GET' }).handler(async (): Promise<PodcastData> => {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('The podcast is temporarily unavailable.');
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers); if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
  const episodes: PodcastData['episodes'] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('episodes')
      .select('id,slug,title,summary,episode_number,season,published_on,cover_url,embed_url,duration_seconds')
      .eq('status', 'published').order('id').range(offset, offset + 999);
    if (error) throw new Error('Episodes could not be loaded.');
    episodes.push(...(data ?? []).map((item) => ({ ...item, guests: [], topics: [] })));
    if (!data || data.length < 1000) break;
  }
  const guestLinks: { episode_id: string; person_id: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('person_episodes').select('episode_id,person_id').eq('role', 'guest').order('id').range(offset, offset + 999);
    if (error) throw new Error('Episode guests could not be loaded.');
    guestLinks.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const topicLinks: { episode_id: string; term_id: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('episode_terms').select('episode_id,term_id').order('id').range(offset, offset + 999);
    if (error) throw new Error('Episode topics could not be loaded.');
    topicLinks.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const personIds = [...new Set(guestLinks.map((link) => link.person_id))];
  const guests = new Map<string, { slug: string; name: string }>();
  if (personIds.length) {
    // public_people returns only published people, so unpublished guests stay hidden.
    const { data, error } = await client.rpc('public_people');
    if (error) throw new Error('Episode guests could not be loaded.');
    for (const person of data ?? []) if (personIds.includes(person.id)) guests.set(person.id, { slug: person.slug, name: person.full_name });
  }
  const termIds = [...new Set(topicLinks.map((link) => link.term_id))];
  const terms = new Map<string, string>();
  if (termIds.length) {
    const { data, error } = await client.from('terms').select('id,name').in('id', termIds);
    if (error) throw new Error('Episode topics could not be loaded.');
    for (const term of data ?? []) terms.set(term.id, term.name);
  }
  return { episodes: episodes.map((episode) => ({
    ...episode,
    guests: guestLinks.filter((link) => link.episode_id === episode.id)
      .flatMap((link) => { const guest = guests.get(link.person_id); return guest ? [{ id: link.person_id, ...guest }] : []; }),
    topics: topicLinks.filter((link) => link.episode_id === episode.id)
      .flatMap((link) => { const name = terms.get(link.term_id); return name ? [{ id: link.term_id, name }] : []; }),
  })) };
});
