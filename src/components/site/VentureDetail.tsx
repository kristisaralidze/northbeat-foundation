import { lazy, Suspense, useState } from 'react';
import { ClientOnly, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { daysUntil, eventCalendar, googleCalendar, type CalendarEvent } from '@/lib/detail';
import { dateLabel, dayKey } from '@/lib/events';
import { humanize } from '@/lib/admin/entities';
import { EMPTY_SEARCH } from '@/lib/explore';
import { safeWebUrl, text, type DetailItem, type PublicProfile, type RelatedEntry } from '@/lib/profiles';
import { OrganisationCover } from './OrganisationCover';
import { OrganisationLogo } from './OrganisationLogo';
import { brandColour } from '@/lib/brand';
import { officialVideo } from '@/lib/video';
import { VideoEmbed } from './VideoEmbed';
import { NewsSection, ResearchSection, TrialsSection, asResearch } from './OpenDataSections';
import { ytjRecordUrl, type NewsItem } from '@/lib/enrich';
import { RelationshipMap } from './RelationshipMap';
const MapView = lazy(() => import('./VenueMap').then(module => ({ default: module.VenueMap })));

function DetailLink({ item, children }: { item: RelatedEntry & { kind: string }; children: React.ReactNode }) {
  if (item.kind === 'organisations') return <Link to="/org/$slug" params={{ slug: item.slug }} className="nb-link">{children}</Link>;
  if (item.kind === 'events') return <Link to="/event/$slug" params={{ slug: item.slug }} className="nb-link">{children}</Link>;
  if (item.kind === 'opportunities') return <Link to="/opportunity/$slug" params={{ slug: item.slug }} className="nb-link">{children}</Link>;
  return <Link to="/person/$slug" params={{ slug: item.slug }} className="nb-link">{children}</Link>;
}
function Recommendations({ title, items, now }: { title: string; items: DetailItem[]; now: string }) {
  if (!items.length) return null;
  return <section className="nb-detail-section"><h2 className="nb-h2 mb-6">{title}</h2><ul className="nb-detail-list">{items.map(item => {
    const days = daysUntil(item.date, now);
    return <li key={`${item.kind}:${item.id}`}><div className="min-w-0"><p className="nb-small text-muted-foreground">{item.date ? dateLabel(item.date) : null}{item.type ? `, ${humanize(item.type)}` : ''}</p><h3 className="nb-h3 mt-2"><DetailLink item={item}>{item.title}</DetailLink></h3>{item.summary && <p className="nb-small mt-3 text-muted-foreground">{item.summary}</p>}</div>{days !== null && days >= 0 && <span className="nb-countdown">{days === 0 ? item.kind === 'events' ? 'Today' : 'Closes today' : `${item.kind === 'events' ? 'In' : 'Closes in'} ${days} ${days === 1 ? 'day' : 'days'}`}</span>}</li>;
  })}</ul></section>;
}
function CalendarActions({ profile }: { profile: PublicProfile }) {
  const [message, setMessage] = useState(''); const start = text(profile.row, 'starts_at');
  const register = safeWebUrl(text(profile.row, 'registration_url'));
  function calendar(): CalendarEvent | null {
    if (!start || !Number.isFinite(Date.parse(start))) return null;
    return { id: profile.row.id, title: profile.title, start, end: text(profile.row, 'ends_at'), location: [text(profile.row, 'venue'), text(profile.row, 'city')].filter(Boolean).join(', '), description: profile.summary ?? '', url: window.location.href };
  }
  function download() { const value = calendar(); if (!value) return; const url = URL.createObjectURL(new Blob([eventCalendar(value)], { type: 'text/calendar;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `${profile.row.slug}.ics`; a.click(); URL.revokeObjectURL(url); }
  return <div className="nb-detail-actions">{register && <Button asChild variant="ghost" className="nb-btn nb-btn-primary"><a href={register} target="_blank" rel="noopener noreferrer">Register</a></Button>}{start && <><Button variant="ghost" className="nb-btn nb-btn-secondary" onClick={download}>Add to calendar</Button><Button variant="ghost" className="nb-btn nb-btn-secondary" onClick={() => { const value = calendar(); if (value) window.open(googleCalendar(value), '_blank', 'noopener,noreferrer'); }}>Google Calendar</Button></>}<Button variant="ghost" className="nb-btn nb-btn-secondary" onClick={async () => { try { if (navigator.share) await navigator.share({ title: profile.title, url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); setMessage('Link copied'); } } catch { setMessage('Could not share the link'); } }}>Share</Button>{message && <span className="nb-small" role="status">{message}</span>}</div>;
}
export function VentureDetail({ profile }: { profile: PublicProfile }) {
  const { row, terms, detail } = profile; const isOrg = profile.kind === 'organisations';
  const now = detail?.now ?? ''; const start = text(row, 'starts_at'); const days = daysUntil(start, now, text(row, 'timezone') ?? undefined);
  const steps = terms.filter(term => term.kind === 'journey_step');
  const names = (kind: string) => terms.filter(term => term.kind === kind).map(term => term.name).join(', ') || null;
  const label = humanize(text(row, isOrg ? 'type' : 'event_type') ?? '');
  const businessId = isOrg ? text(row, 'business_id') : null; const registered = text(row, 'registration_date');
  const facts: [string, string | null][] = isOrg ? [['Type', label], ['Location', [text(row, 'city'), names('country')].filter(Boolean).join(', ')], ['Founded', row['founded_year'] ? String(row['founded_year']) : null], ['Stages', names('stage')], ['Fields', names('field')], ['Business ID', businessId ? `${businessId}${registered ? `, registered ${registered.slice(0, 4)}` : ''}` : null]] : [['Dates', start ? `${dateLabel(start, text(row, 'timezone'))}${text(row, 'ends_at') && dayKey(String(row['ends_at'])) !== dayKey(start) ? ` to ${dateLabel(String(row['ends_at']), text(row, 'timezone'))}` : ''}` : null], ['Venue', [text(row, 'venue'), text(row, 'city')].filter(Boolean).join(', ')], ['Format', text(row, 'format') ? humanize(String(row['format'])) : null], ['Type', label], ['Fields', names('field')], ['Price', text(row, 'price_note')], ['Apply by', text(row, 'apply_deadline_at') ? dateLabel(String(row['apply_deadline_at'])) : null]];
  const connections = profile.related.filter(group => group.kind === 'organisations'); const connectionProfile = { ...profile, related: connections };
  const otherGroups = profile.related.filter(group => !['organisations', 'events', 'opportunities'].includes(group.kind));
  const venue = text(row, 'venue'); const city = text(row, 'city'); const lat = row['latitude'], lng = row['longitude']; const coordinates: [number, number] | null = row['format'] !== 'online' && typeof lat === 'number' && typeof lng === 'number' ? [lat, lng] : null;
  const research = isOrg ? asResearch(row['research']) : null; const trials = isOrg && Array.isArray(row['trials']) ? row['trials'] as unknown as Parameters<typeof TrialsSection>[0]['trials'] : []; const news = isOrg && Array.isArray(row['news_items']) ? row['news_items'] as unknown as NewsItem[] : [];
  const website = safeWebUrl(text(row, 'website')); const description = text(row, 'description');
  const video = officialVideo(text(row, 'video_url'), text(row, 'video_source_url'));
  const accent = isOrg ? brandColour(row['brand_accent']) : null;
  return <article className="nb-container nb-section nb-venture-detail" style={accent ? { '--official-brand-accent': accent } as React.CSSProperties : undefined}>
    <OrganisationCover image={text(row, 'cover_image_url')} website={text(row, 'image_source_url') ?? text(row, isOrg ? 'website' : 'registration_url') ?? text(row, 'source_url')} name={profile.title} />
    <div className="mb-8">{isOrg ? <Link to="/explore" search={EMPTY_SEARCH} className="nb-link">Explore</Link> : <Link to="/events" search={{ type: '', city: '', month: '', archive: false, view: 'list' }} className="nb-link">Events</Link>}</div>
    <header data-profile-identity data-profile-detail={isOrg ? [label, city].filter(Boolean).join(', ') : label} className="nb-detail-identity">
      <OrganisationLogo name={profile.title} uploaded={text(row,'logo_url')} website={text(row,isOrg ? 'website' : 'registration_url') ?? text(row,'source_url')} source={text(row,'logo_image_source')} sourceUrl={text(row,'logo_image_source_url')} large eager automatic={isOrg} />
      <div className="min-w-0 flex-1"><h1 data-page-title className="nb-h1 break-words">{profile.title}</h1>{!isOrg && days !== null && <p className="nb-countdown mt-4">{days > 0 ? `In ${days} ${days === 1 ? 'day' : 'days'}` : days === 0 ? 'Today' : text(row, 'ends_at') && Date.parse(String(row['ends_at'])) >= Date.parse(now) ? 'Happening now' : 'Past event'}</p>}{profile.summary && <p className="nb-lead mt-5">{profile.summary}</p>}<dl className="nb-facts-strip">{facts.filter(([,value])=>value).map(([name,value])=><div key={name}><dt>{name}</dt><dd className={name === 'Fields' ? 'nb-official-field' : undefined}>{value}</dd></div>)}</dl>{businessId && <p className="nb-registry-note">Verified in the Finnish Trade Register. <a className="nb-link" href={ytjRecordUrl(businessId)} target="_blank" rel="noopener noreferrer">View the official YTJ record</a></p>}</div>
    </header>
    {!isOrg && <CalendarActions profile={profile} />}
    {video && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Watch</h2><VideoEmbed video={video} title={profile.title} channel={text(row, 'video_source_url')} /></section>}
    {research && <ResearchSection research={research} />}
    {description && description !== profile.summary && <p className="nb-body nb-detail-description">{description}</p>}
    {steps.length > 0 && <section className="nb-detail-section"><h2 className="nb-h2 mb-5">{isOrg ? 'Useful if you are…' : 'Go if you are…'}</h2><ul className="nb-journey-sentences">{steps.map(step => <li key={step.id}>{journeySentence(step.name)}</li>)}</ul></section>}
    {isOrg && connections.length > 0 && <section className="nb-detail-section"><h2 className="nb-h2">Connections</h2><RelationshipMap profile={connectionProfile} link={(kind, entry) => <DetailLink item={{ ...entry, kind }}>{entry.title}</DetailLink>} /><div className="nb-connection-lists">{connections.map(group => <div key={group.label}><h3 className="nb-h3 mb-4">{group.label}</h3><ul className="space-y-3">{group.entries.map(entry => <li key={entry.id}><DetailLink item={{ ...entry, kind: group.kind }}>{entry.title}</DetailLink></li>)}</ul></div>)}</div></section>}
    <TrialsSection trials={trials} />
    <NewsSection items={news} />
    {isOrg && detail && <Recommendations title="Coming up with them" items={detail.coming} now={now} />}
    {coordinates && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">{isOrg ? 'Location' : 'Venue'}</h2><ClientOnly fallback={null}><Suspense fallback={null}><MapView latitude={coordinates[0]} longitude={coordinates[1]} name={venue ?? city ?? ''} /></Suspense></ClientOnly><a className="nb-link nb-small mt-3 inline-block" href={`https://www.openstreetmap.org/?mlat=${coordinates[0]}&mlon=${coordinates[1]}#map=16/${coordinates[0]}/${coordinates[1]}`} target="_blank" rel="noopener noreferrer">Open in OpenStreetMap</a><p className="nb-small text-muted-foreground mt-2">© OpenStreetMap contributors</p></section>}
    {!isOrg && connections.length > 0 && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Organiser</h2><div className="grid gap-5 sm:grid-cols-2">{connections.flatMap(group => group.entries).map(entry => <article className="nb-card" key={entry.id}><OrganisationLogo name={entry.title} slug={entry.slug} /><h3 className="nb-h3 mt-4"><DetailLink item={{ ...entry, kind: 'organisations' }}>{entry.title}</DetailLink></h3>{entry.summary && <p className="nb-small mt-3">{entry.summary}</p>}</article>)}</div></section>}
    {!isOrg && detail && <Recommendations title="Same week" items={detail.sameWeek} now={now} />}
    {!isOrg && Boolean(detail?.guides.length) && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Prepare</h2><ul className="space-y-5">{detail?.guides.map(guide => <li key={guide.slug}><h3 className="nb-h3"><Link to="/learn/$slug" params={{ slug: guide.slug }} className="nb-link">{guide.title}</Link></h3>{guide.summary && <p className="nb-small mt-2">{guide.summary}</p>}</li>)}</ul></section>}
    {isOrg && Boolean(detail?.similar.length) && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Similar in the Nordics</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{detail?.similar.map(entry => <article key={entry.id} className="nb-card"><OrganisationLogo name={entry.title} slug={entry.slug} /><h3 className="nb-h3 mt-4"><DetailLink item={{ ...entry, kind: 'organisations' }}>{entry.title}</DetailLink></h3>{entry.summary && <p className="nb-small mt-3">{entry.summary}</p>}</article>)}</div></section>}
    {otherGroups.map(group => <section className="nb-detail-section" key={group.label}><h2 className="nb-h2 mb-5">{group.label}</h2><ul className="space-y-3">{group.entries.map(entry => <li key={entry.id}>{group.kind === 'episodes' ? <Link to="/podcast/$slug" params={{ slug: entry.slug }} className="nb-link">{entry.title}</Link> : <DetailLink item={{ ...entry, kind: group.kind }}>{entry.title}</DetailLink>}</li>)}</ul></section>)}
    <footer className="nb-detail-section"><div className="nb-detail-actions">{isOrg && website && <Button asChild variant="ghost" className="nb-btn nb-btn-primary"><a href={website} target="_blank" rel="noopener noreferrer">Visit website</a></Button>}<Button asChild variant="ghost" className="nb-btn nb-btn-secondary"><Link to="/newsletter">Get the newsletter</Link></Button><Button asChild variant="ghost" className="nb-btn nb-btn-secondary"><Link to="/submit" search={{ tab: isOrg ? 'company' : 'event', edit: profile.title, entryUrl: `https://nordic-heartbeat.lovable.app/${isOrg ? 'org' : 'event'}/${encodeURIComponent(row.slug)}` }}>Suggest an edit</Link></Button></div>{text(row, 'last_checked') && <p className="nb-small text-muted-foreground mt-5">Last checked {dateLabel(String(row['last_checked']))}</p>}</footer>
  </article>;
}
function journeySentence(name: string) {
  const sentences: Record<string, string> = { funding: 'Looking for funding.', growth: 'Growing your venture.', validation: 'Validating your idea.', idea: 'Developing an idea.', research: 'Turning research into a venture.', team: 'Building your team.', launch: 'Preparing to launch.', regulation: 'Working through regulation.' };
  return sentences[name.toLowerCase()] ?? `Working on ${name.charAt(0).toLowerCase()}${name.slice(1)}.`;
}