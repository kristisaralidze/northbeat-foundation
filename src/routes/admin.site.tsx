import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { db } from '@/lib/admin/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageField } from '@/components/admin/ImageField';
import { toCsv } from '@/lib/site';

export const Route = createFileRoute('/admin/site')({
  head: () => ({ meta: [{ title: 'Site and founders | Northbeat admin' }, { name: 'description', content: 'Contact details, social links, founders and the Systole waitlist.' }, { property: 'og:title', content: 'Site and founders | Northbeat admin' }, { property: 'og:description', content: 'Contact details, social links, founders and the Systole waitlist.' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: SiteAdmin,
});

type Settings = { contact_email: string; linkedin_url: string; instagram_url: string };
type Founder = { id?: string; name: string; one_line: string; photo_url: string; linkedin_url: string; sort_order: number };
const blankFounder = (n: number): Founder => ({ name: '', one_line: '', photo_url: '', linkedin_url: '', sort_order: n });
const httpsOrEmpty = (v: string) => !v.trim() || /^https:\/\/\S+$/i.test(v.trim());

function SiteAdmin() {
  const [settings, setSettings] = useState<Settings>({ contact_email: '', linkedin_url: '', instagram_url: '' });
  const [founders, setFounders] = useState<Founder[]>([]);
  const [waitlist, setWaitlist] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [s, f, w] = await Promise.all([
      db.from('site_settings').select('contact_email,linkedin_url,instagram_url').eq('id', 1).maybeSingle(),
      db.from('founders').select('id,name,one_line,photo_url,linkedin_url,sort_order').order('sort_order'),
      db.from('systole_waitlist').select('id', { count: 'exact', head: true }),
    ]);
    if (s.data) setSettings({ contact_email: s.data.contact_email ?? '', linkedin_url: s.data.linkedin_url ?? '', instagram_url: s.data.instagram_url ?? '' });
    setFounders(((f.data ?? []) as Founder[]).map(x => ({ ...x, one_line: x.one_line ?? '', photo_url: x.photo_url ?? '', linkedin_url: x.linkedin_url ?? '' })));
    setWaitlist(w.count ?? 0);
  };
  useEffect(() => { void load(); }, []);

  const saveSettings = async () => {
    if (settings.contact_email && !/^\S+@\S+\.\S+$/.test(settings.contact_email)) { toast.error('Check the contact email.'); return; }
    if (!httpsOrEmpty(settings.linkedin_url) || !httpsOrEmpty(settings.instagram_url)) { toast.error('Links must start with https://'); return; }
    setBusy(true);
    const clean = (v: string) => v.trim() || null;
    const { error } = await db.from('site_settings').upsert({ id: 1, contact_email: clean(settings.contact_email), linkedin_url: clean(settings.linkedin_url), instagram_url: clean(settings.instagram_url), updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) toast.error(error.message); else toast.success('Saved');
  };

  const saveFounder = async (f: Founder, i: number) => {
    if (!f.name.trim()) { toast.error('Add a name.'); return; }
    if (!httpsOrEmpty(f.linkedin_url)) { toast.error('LinkedIn link must start with https://'); return; }
    setBusy(true);
    const row = { name: f.name.trim(), one_line: f.one_line.trim() || null, photo_url: f.photo_url.trim() || null, linkedin_url: f.linkedin_url.trim() || null, sort_order: i };
    const { error } = f.id ? await db.from('founders').update(row).eq('id', f.id) : await db.from('founders').insert(row);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success('Founder saved'); await load(); }
  };
  const removeFounder = async (f: Founder, i: number) => {
    if (!f.id) { setFounders(list => list.filter((_, j) => j !== i)); return; }
    if (!confirm(`Remove ${f.name}?`)) return;
    const { error } = await db.from('founders').delete().eq('id', f.id);
    if (error) toast.error(error.message); else await load();
  };
  const update = (i: number, patch: Partial<Founder>) => setFounders(list => list.map((f, j) => j === i ? { ...f, ...patch } : f));

  const exportCsv = async () => {
    const rows: { email: string; created_at: string }[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from('systole_waitlist').select('email,created_at').order('created_at').range(from, from + 999);
      if (error) { toast.error(error.message); return; }
      rows.push(...(data ?? [])); if (!data || data.length < 1000) break;
    }
    const blob = new Blob([toCsv(['email', 'created_at'], rows.map(r => [r.email, r.created_at]))], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `systole-waitlist-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  return <div className="max-w-3xl space-y-10">
    <h1 className="text-xl font-semibold text-foreground">Site and founders</h1>

    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Contact and social links</h2>
      <p className="text-sm text-muted-foreground">Shown in the footer and on the About page. Leave a field empty to hide it.</p>
      <div className="space-y-2"><Label htmlFor="s-email">Contact email</Label><Input id="s-email" type="email" value={settings.contact_email} onChange={e => setSettings({ ...settings, contact_email: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="s-li">LinkedIn page</Label><Input id="s-li" type="url" placeholder="https://www.linkedin.com/company/..." value={settings.linkedin_url} onChange={e => setSettings({ ...settings, linkedin_url: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="s-ig">Instagram</Label><Input id="s-ig" type="url" placeholder="https://www.instagram.com/..." value={settings.instagram_url} onChange={e => setSettings({ ...settings, instagram_url: e.target.value })} /></div>
      <Button onClick={saveSettings} disabled={busy}>Save</Button>
    </section>

    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Founders</h2>
      <p className="text-sm text-muted-foreground">Shown on the About page in this order. The section is hidden until at least one founder is saved.</p>
      {founders.map((f, i) => <div key={f.id ?? `new-${i}`} className="space-y-3 rounded-md border border-border p-4">
        <div className="space-y-2"><Label htmlFor={`f-name-${i}`}>Name</Label><Input id={`f-name-${i}`} value={f.name} onChange={e => update(i, { name: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor={`f-line-${i}`}>One line</Label><Input id={`f-line-${i}`} value={f.one_line} maxLength={140} onChange={e => update(i, { one_line: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor={`f-li-${i}`}>LinkedIn</Label><Input id={`f-li-${i}`} type="url" value={f.linkedin_url} onChange={e => update(i, { linkedin_url: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor={`f-photo-${i}`}>Photo</Label><ImageField id={`f-photo-${i}`} folder="founders" value={f.photo_url} onChange={v => update(i, { photo_url: v })} /></div>
        <div className="flex gap-2"><Button onClick={() => saveFounder(f, i)} disabled={busy}>Save founder</Button><Button variant="outline" onClick={() => removeFounder(f, i)}>Remove</Button></div>
      </div>)}
      <Button variant="outline" onClick={() => setFounders(list => [...list, blankFounder(list.length)])}>Add a founder</Button>
    </section>

    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Systole waitlist</h2>
      <p className="text-sm text-muted-foreground">{waitlist === null ? 'Loading…' : `${waitlist} ${waitlist === 1 ? 'person' : 'people'} on the list.`}</p>
      <Button onClick={exportCsv} disabled={!waitlist}>Export CSV</Button>
    </section>
  </div>;
}
