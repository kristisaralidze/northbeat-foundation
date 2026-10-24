import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrganisationLogo, logoSource } from '@/components/site/OrganisationLogo';
import { organisationDomain } from '@/lib/organisation-logo';

export const Route = createFileRoute('/admin/logo-check')({
  head: () => ({ meta: [{ title: 'Logo check | Northbeat admin' }, { name: 'description', content: 'Every organisation with its website domain, the logo shown and its source.' }, { property: 'og:title', content: 'Logo check | Northbeat admin' }, { property: 'og:description', content: 'Every organisation with its website domain, the logo shown and its source.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: LogoCheck,
});

type Row = { id: string; name: string; status: string; website: string | null; logo_url: string | null; logo_choice: string };

function LogoCheck() {
  const [filter, setFilter] = useState('');
  const q = useQuery({ queryKey: ['admin-logo-check'], queryFn: async () => {
    const rows: Row[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from('organisations').select('id,name,status,website,logo_url,logo_choice').order('name').range(from, from + 999);
      if (error) throw error; rows.push(...data); if (data.length < 1000) return rows;
    }
  } });
  const rows = (q.data ?? []).filter(o => !filter || `${o.name} ${o.website ?? ''}`.toLowerCase().includes(filter.toLowerCase()));
  return <section className="space-y-6">
    <h1 className="text-2xl font-semibold">Logo check</h1>
    <p className="text-muted-foreground">Logos show only from the organisation's own website domain (Brandfetch for that exact domain) or an admin upload. No website means the name shows instead. An empty logo cell means nothing loaded. Click a name to fix it.</p>
    <input className="h-10 w-full max-w-sm rounded-md border border-border px-3" placeholder="Filter by name or domain" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter organisations" />
    {q.isPending ? <p>Loading…</p> : q.error ? <p role="alert">Could not load organisations.</p> : <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left"><th className="py-2 pr-4">Organisation</th><th className="py-2 pr-4">Website domain</th><th className="py-2 pr-4">Logo shown</th><th className="py-2 pr-4">Source</th><th className="py-2">Status</th></tr></thead>
        <tbody>{rows.map(o => <tr key={o.id} className="border-b border-border align-middle">
          <td className="py-2 pr-4"><Link to="/admin/organisations/$id" params={{ id: o.id }} className="underline">{o.name}</Link></td>
          <td className="py-2 pr-4">{organisationDomain(o.website) ?? <span className="text-muted-foreground">None</span>}</td>
          <td className="py-2 pr-4"><span className="flex h-14 w-14 items-center"><OrganisationLogo name={o.name} website={o.website ?? null} uploaded={o.logo_url} choice={o.logo_choice} /></span></td>
          <td className="py-2 pr-4">{logoSource(o.logo_choice, o.logo_url, o.website)}</td>
          <td className="py-2">{o.status}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
