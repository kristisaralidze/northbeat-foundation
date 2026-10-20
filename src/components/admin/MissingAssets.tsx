import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getMissingAssets } from '@/lib/assets.functions';
import { officialLogo } from '@/lib/brand';
import { organisationLogoUrl } from '@/lib/organisation-logo';
import { safeWebUrl } from '@/lib/profiles';
export function MissingAssets() {
  const get = useServerFn(getMissingAssets);
  const query = useQuery({ queryKey: ['missing-assets'], queryFn: () => get() });
  const [real, setReal] = useState<Record<string,boolean>>({});
  const rows = (query.data ?? []).filter(row => (!officialLogo(row.logo_url,row.website,row.logo_image_source,row.logo_image_source_url) && !real[row.id]) || !row.cover_image_url || row.cover_image_status !== 'approved');
  return <section className="space-y-6"><h1 className="text-2xl font-semibold">Missing official assets</h1>{query.isPending ? <p>Loading…</p> : query.error ? <p role="alert">Could not load assets.</p> : <><p className="text-muted-foreground">{rows.length} organisations</p><ul className="space-y-4">{rows.map(row => {
    const logo = officialLogo(row.logo_url,row.website,row.logo_image_source,row.logo_image_source_url); const automatic = row.brand_fetched_at ? null : organisationLogoUrl(null,row.website); const website = safeWebUrl(row.website);
    return <li className="border-b border-border pb-4" key={row.id}><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold"><Link to="/admin/organisations/$id" params={{ id:row.id }} className="underline">{row.name}</Link></h2><p className="text-sm text-muted-foreground">{!logo && !real[row.id] ? automatic && real[row.id] === undefined ? 'Checking logo. ' : 'Missing logo. ' : ''}{!row.cover_image_url || row.cover_image_status !== 'approved' ? 'Missing approved cover.' : ''}</p></div>{website && <a href={website} target="_blank" rel="noopener noreferrer" className="text-sm underline break-all">{website}</a>}</div>{!logo && automatic && real[row.id] === undefined && <img src={automatic} alt="" className="hidden" onLoad={()=>setReal(prev=>({...prev,[row.id]:true}))} onError={()=>setReal(prev=>({...prev,[row.id]:false}))} />}</li>;
  })}</ul></>}</section>;
}