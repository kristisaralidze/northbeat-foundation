import { useEffect,useId,useRef,useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BRANDFETCH_CLIENT_ID } from '@/lib/organisation-logo';
import { BRAND_SEARCH_DELAY,BRAND_SEARCH_MIN,brandSuggestions,type BrandSuggestion } from '@/lib/brand-search';

export function BrandSearch({ id,value,onChange,onSelect,className }: { id?:string;value:string;onChange:(value:string)=>void;onSelect:(name:string,website:string)=>void;className?:string }) {
  const generated=useId(); const listId=`${generated}-brands`;
  const [suggestions,setSuggestions]=useState<BrandSuggestion[]>([]); const [open,setOpen]=useState(false); const [index,setIndex]=useState(-1); const [busy,setBusy]=useState(false);
  const confirmed=useRef<string|null>(null);
  useEffect(()=>{
    setSuggestions([]);setIndex(-1);
    const name=value.trim(); if(name.length<BRAND_SEARCH_MIN || confirmed.current===value) {setBusy(false);return;}
    const abort=new AbortController();
    const timer=setTimeout(async()=>{setBusy(true);try {
      const response=await fetch(`https://api.brandfetch.io/v2/search/${encodeURIComponent(name)}?c=${encodeURIComponent(BRANDFETCH_CLIENT_ID)}`,{signal:abort.signal,cache:'no-store'});
      if(!response.ok) return;
      const results=brandSuggestions(await response.json()); if(!abort.signal.aborted) setSuggestions(results);
    } catch { /* Manual entry remains available. */ } finally {if(!abort.signal.aborted)setBusy(false);}},BRAND_SEARCH_DELAY);
    return()=>{clearTimeout(timer);abort.abort();};
  },[value]);
  function pick(item:BrandSuggestion) {confirmed.current=item.name;setOpen(false);setSuggestions([]);onSelect(item.name,`https://${item.domain}`);}
  const visible=open && suggestions.length>0;
  return <div className="relative" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)) {setOpen(false);setSuggestions([]);}}}>
    <Input id={id} className={className} required value={value} role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={listId} aria-activedescendant={visible && index>=0 ? `${listId}-${index}` : undefined} autoComplete="off" onFocus={()=>setOpen(true)} onChange={event=>{confirmed.current=null;onChange(event.target.value);setOpen(true);}} onKeyDown={event=>{
      if(event.key==='Escape'){setOpen(false);return;} if(!visible)return;
      if(event.key==='ArrowDown'){event.preventDefault();setIndex(previous=>(previous+1)%suggestions.length);} if(event.key==='ArrowUp'){event.preventDefault();setIndex(previous=>(previous-1+suggestions.length)%suggestions.length);} if(event.key==='Enter' && index>=0){const item=suggestions[index];if(item){event.preventDefault();pick(item);}}
    }} />
    {visible && <div className="absolute z-30 mt-1 w-full border border-border bg-popover text-popover-foreground shadow-sm"><ul id={listId} role="listbox" aria-label="Organisation suggestions">{suggestions.map((item,i)=><li key={item.domain} id={`${listId}-${i}`} role="option" aria-selected={index===i}><Button type="button" variant="ghost" className="h-auto w-full justify-start gap-3 rounded-none px-3 py-3 text-left" onMouseDown={event=>event.preventDefault()} onClick={()=>pick(item)}>{item.logo && <img src={item.logo} alt="" className="h-8 w-8 shrink-0 object-contain" onError={event=>{event.currentTarget.hidden=true;}} />}<span className="min-w-0"><span className="block whitespace-normal break-words">{item.name}</span><span className="block text-xs text-muted-foreground">{item.domain}</span></span></Button></li>)}</ul><p className="px-3 pb-2 text-xs text-muted-foreground">Logos by Brandfetch</p></div>}
    {busy && <span className="sr-only" role="status">Looking up organisations</span>}
  </div>;
}