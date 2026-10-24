import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { directoryQuery } from '@/lib/directory.query';
import { brandfetchLogoUrl } from '@/lib/organisation-logo';
import { isMediaUpload } from '@/lib/brand';
export function chosenLogoSrc(choice: string | null | undefined, uploaded: string | null | undefined, website: string | null | undefined) {
  if ((choice === 'upload' || choice === 'verified' || isMediaUpload(uploaded)) && uploaded) return uploaded;
  return brandfetchLogoUrl(website, choice ?? 'icon');
}
/**
 * Default is always the Brandfetch icon for the website domain on a white tile.
 * A stored admin check only changes the display when it has a result:
 * tone "light" swaps the tile to ink, status "missing" shows the name instead.
 * Admin uploads always win. The Brandfetch "symbol" type is never used.
 */
export function OrganisationLogo({name,slug,uploaded,website,eager=false,large=false,choice,resolved,tone,status}: {
  name:string;slug?:string|undefined;uploaded?:string|null|undefined;website?:string|null|undefined;eager?:boolean;large?:boolean;choice?:string|null|undefined;
  resolved?:string|null|undefined;tone?:string|null|undefined;status?:string|null|undefined;source?:string|null|undefined;sourceUrl?:string|null|undefined;automatic?:boolean;
}) {
  const {data}=useQuery({...directoryQuery,enabled:Boolean(slug)});
  const org=data?.organisations.find(o=>o.slug===slug);
  const upload=(choice==='upload'||org?.logo_choice==='upload'||org?.logo_image_source==='admin_upload'||isMediaUpload(uploaded))?(uploaded??org?.logo_url):null;
  const storedStatus=status??org?.logo_status??null;
  const storedResolved=resolved===undefined?org?.logo_resolved_url:resolved;
  const storedTone=tone??org?.logo_tone??null;
  const brandfetch=brandfetchLogoUrl(website??org?.website??null,choice&&choice!=='upload'&&choice!=='verified'?choice:'icon');
  const src=upload??(storedStatus==='missing'?null:storedResolved??brandfetch);
  const [failed,setFailed]=useState<string|null>(null);
  const missing=!src||src===failed||(!upload&&storedStatus==='missing');
  return <span className={`nb-org-logo${large?' nb-official-logo-large':''}`} data-organisation-logo={slug} data-tone={storedTone??'dark'} data-logo-status={missing?'missing':storedStatus??'ok'}>
    {missing?<span className="nb-logo-name">{name}</span>:<img src={src??undefined} alt={`${name} logo`} width={128} height={128} loading={eager?'eager':'lazy'} decoding="async" onError={()=>setFailed(src??null)}/>}
  </span>;
}
export function logoSource(choice:string|null|undefined,uploaded:string|null|undefined,_website:string|null|undefined) {
  return choice==='upload'||isMediaUpload(uploaded)?'Admin upload':'Brandfetch icon';
}
