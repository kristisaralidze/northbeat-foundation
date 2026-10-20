import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrganisationLogo } from '@/components/site/OrganisationLogo';

export const Route = createFileRoute('/admin/logo-check')({
  head: () => ({ meta: [{ title: 'Logo check | Northbeat admin' }, { name: 'description', content: 'Scan every published organisation logo at once.' }, { property: 'og:title', content: 'Logo check | Northbeat admin' }, { property: 'og:description', content: 'Scan every published organisation logo at once.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: LogoCheck,
});

function LogoCheck() {
  const q = useQuery({ queryKey: ['admin-logo-check'], queryFn: async () => {
    const rows: { id: string; name: string | null; website: string | null; logo_url: string | null; logo_choice: string }[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from('organisations').select('id,name,website,logo_url,logo_choice').eq('status', 'published').order('name').range(from, from + 999);
      if (error) throw error; rows.push(...data); if (data.length < 1000) return rows;
    }
  } });
  return <section className="space-y-6">
    <h1 className="text-2xl font-semibold">Logo check</h1>
    {q.isPending ? <p>Loading…</p> : q.error ? <p role="alert">Could not load organisations.</p> : <>
      <p className="text-muted-foreground">{q.data.length} published organisations. Click one to open its logo picker. An empty tile means only the name shows publicly.</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{q.data.map(o => <li key={o.id}>
        <Link to="/admin/organisations/$id" params={{ id: o.id }} className="flex h-full flex-col items-center gap-2 rounded-md border border-border p-3 text-center text-sm hover:border-primary">
          <span className="flex h-20 items-center justify-center"><OrganisationLogo name={o.name ?? ''} website={o.website} uploaded={o.logo_url} choice={o.logo_choice} /></span>
          <span>{o.name}</span>
        </Link></li>)}</ul>
    </>}
  </section>;
}
