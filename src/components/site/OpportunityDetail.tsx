import {Link} from '@tanstack/react-router';
import {useState} from 'react';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {CalendarMenu} from './CalendarMenu';
import {OrganisationLogo} from './OrganisationLogo';
import {opportunitiesQuery} from '@/lib/opportunities.query';
import {amountLabel,isClosed,isRolling} from '@/lib/opportunities';
import {dateLabel} from '@/lib/events';
import {daysUntil,countdownClass,type CalendarEvent} from '@/lib/detail';
import {humanize} from '@/lib/admin/entities';
import {safeWebUrl,text,type PublicProfile} from '@/lib/profiles';
import {useSaved} from '@/lib/saved';
const lines=(v:unknown)=>Array.isArray(v)?v.filter((s):s is string=>typeof s==='string'&&Boolean(s.trim())):[];
export function OpportunityDetail({profile}:{profile:PublicProfile}) {
  const {data}=useSuspenseQuery(opportunitiesQuery);const {row}=profile;const deadline=text(row,'deadline_at');const now=data.now;
  const own=data.opportunities.find(o=>o.id===row.id);const closed=own?isClosed(own,now):Boolean(deadline&&Date.parse(deadline)<Date.parse(now));
  const days=daysUntil(deadline,now);const apply=safeWebUrl(text(row,'apply_url'));const amount=amountLabel({amount_min_eur:typeof row['amount_min_eur']==='number'?row['amount_min_eur']:null,amount_max_eur:typeof row['amount_max_eur']==='number'?row['amount_max_eur']:null});
  const rolling=own?isRolling(own):/rolling|continuous|any time/i.test(profile.summary??'');
  const cal:CalendarEvent|null=deadline&&!closed?{id:row.id,title:`Deadline: ${profile.title}`,start:deadline,end:null,allDay:true,location:'',description:apply?`Apply: ${apply}`:profile.summary??'',url:apply??`https://nordic-heartbeat.lovable.app/opportunity/${row.slug}`}:null;
  const {saved,toggle}=useSaved('opportunity',row.slug,profile.title);const [copied,setCopied]=useState(false);
  const who=lines(row['who_can_apply']);const steps=lines(row['how_to_apply_steps']);const tips=lines(row['tips']).slice(0,3);const benefit=text(row,'what_you_get');
  const fields=profile.terms.filter(t=>t.kind==='field').map(t=>t.id);
  const similar=data.opportunities.filter(o=>o.id!==row.id&&!isClosed(o,now)&&(o.type===row['type']||o.termIds.some(id=>fields.includes(id)))).sort((a,b)=>Number(b.type===row['type'])-Number(a.type===row['type'])||(Date.parse(a.deadline_at??'')||Infinity)-(Date.parse(b.deadline_at??'')||Infinity)).slice(0,3);
  const providers=profile.related.filter(g=>g.kind==='organisations').flatMap(g=>g.entries);
  return <article className="nb-container nb-section nb-venture-detail">
    <header data-profile-identity><h1 data-page-title className="nb-h1">{profile.title}</h1><div className="nb-opportunity-facts">
      {amount&&<p className="nb-opportunity-amount">{amount}</p>}
      <p>{closed?<span className="nb-small">Closed</span>:deadline?<><span>Closes {dateLabel(deadline)}</span>{days!==null&&<span className={countdownClass(days)}>{days===0?'Today':`In ${days} days`}</span>}</>:rolling?'Open all year':'Next call to be announced'}</p><p className="nb-small text-muted-foreground">{humanize(text(row,'type')??'')}</p>
    </div></header>
    <div className="nb-detail-actions nb-action-bar">{closed?<Button disabled variant="ghost" className="nb-btn nb-btn-secondary">Closed</Button>:apply&&<Button asChild variant="ghost" className="nb-btn nb-btn-primary"><a href={apply} target="_blank" rel="noopener noreferrer">Apply</a></Button>}{cal&&<CalendarMenu event={cal} slug={row.slug} label="Add deadline to calendar" />}<Button variant="ghost" className="nb-btn nb-btn-secondary" aria-pressed={saved} onClick={toggle}>{saved?'Saved':'Save'}</Button><Button variant="ghost" className="nb-btn nb-btn-secondary" onClick={async()=>{try{if(navigator.share)await navigator.share({title:profile.title,url:window.location.href});else{await navigator.clipboard.writeText(window.location.href);setCopied(true);}}catch{setCopied(false);}}}>Share</Button>{copied&&<span role="status" className="nb-small">Link copied</span>}</div>
    {who.length>0&&<section className="nb-detail-section"><h2 className="nb-h2 mb-5">Who can apply</h2><ul className="nb-check-list nb-body">{who.map(s=><li key={s}>{s}</li>)}</ul></section>}
    {benefit&&<section className="nb-detail-section"><h2 className="nb-h2 mb-5">What you get</h2><p className="nb-body whitespace-pre-line">{benefit}</p></section>}
    {steps.length>0&&<section className="nb-detail-section"><h2 className="nb-h2 mb-5">How to apply</h2><ol className="nb-apply-steps nb-body">{steps.map(s=><li key={s}>{s}</li>)}</ol></section>}
    {tips.length>0&&<section className="nb-detail-section"><h2 className="nb-h2 mb-5">Tips</h2><ul className="nb-check-list nb-body">{tips.map(s=><li key={s}>{s}</li>)}</ul></section>}
    {providers.length>0&&<section className="nb-detail-section"><h2 className="nb-h2 mb-5">Provider</h2><ul className="space-y-4">{providers.map(p=><li key={p.id} className="flex items-center gap-4"><OrganisationLogo name={p.title} slug={p.slug}/><h3 className="nb-h3"><Link to="/org/$slug" params={{slug:p.slug}} className="nb-link">{p.title}</Link></h3></li>)}</ul></section>}
    {similar.length>0&&<section className="nb-detail-section"><h2 className="nb-h2 mb-5">Similar</h2><ul className="space-y-5">{similar.map(o=><li key={o.id}><h3 className="nb-h3"><Link to="/opportunity/$slug" params={{slug:o.slug}} className="nb-link">{o.title}</Link></h3>{o.deadline_at&&<p className="nb-small text-muted-foreground">Closes {dateLabel(o.deadline_at)}</p>}</li>)}</ul></section>}
  </article>;
}