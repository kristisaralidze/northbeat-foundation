import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { loadPublicProfile } from './profiles.server';
export const getPublicProfile = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => z.object({ kind: z.enum(['organisations', 'people', 'events', 'opportunities', 'episodes']), slug: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error('Profiles are temporarily unavailable.');
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        return fetch(input, { ...init, headers });
      } },
    });
    return loadPublicProfile(client, data.kind, data.slug);
  });
