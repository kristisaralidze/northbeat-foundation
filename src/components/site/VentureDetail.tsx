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
import { SpecimenCard } from './SpecimenCard';
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
function venueCoordinates(venue: string | null, city: string | null): [number, number] | null {
  if (city?.toLowerCase() !== 'helsinki' || !venue) return null;
  if (/messukeskus/i.test(venue)) return [60.203, 24.936];
  if (/finlandia/i.test(venue)) return [60.175, 24.933];
  if (/maria\s*01/i.test(venue)) return [60.168, 24.922];
  return null;
}
export function VentureDetail({ profile }: { profile: PublicProfile }) {
  const { row, terms, detail } = profile; const isOrg = profile.kind === 'organisations';
  const now = detail?.now ?? ''; const start = text(row, 'starts_at'); const days = daysUntil(start, now, text(row, 'timezone') ?? undefined);
  const fields = terms.filter(term => term.kind === 'field'); const steps = terms.filter(term => term.kind === 'journey_step');
  const names = (kind: string) => terms.filter(term => term.kind === kind).map(term => term.name).join(', ') || null;
  const label = humanize(text(row, isOrg ? 'type' : 'event_type') ?? '');
  const facts: [string, string | null][] = isOrg ? [['Type', label], ['Location', [text(row, 'city'), names('country')].filter(Boolean).join(', ')], ['Founded', row['founded_year'] ? String(row['founded_year']) : null], ['Stages', names('stage')], ['Fields', names('field')]] : [['Dates', start ? `${dateLabel(start, text(row, 'timezone'))}${text(row, 'ends_at') && dayKey(String(row['ends_at'])) !== dayKey(start) ? ` to ${dateLabel(String(row['ends_at']), text(row, 'timezone'))}` : ''}` : null], ['Venue', [text(row, 'venue'), text(row, 'city')].filter(Boolean).join(', ')], ['Format', text(row, 'format') ? humanize(String(row['format'])) : null], ['Type', label], ['Fields', names('field')], ['Price', text(row, 'price_note')], ['Apply by', text(row, 'apply_deadline_at') ? dateLabel(String(row['apply_deadline_at'])) : null]];
  const connections = profile.related.filter(group => group.kind === 'organisations'); const connectionProfile = { ...profile, related: connections };
  const otherGroups = profile.related.filter(group => !['organisations', 'events', 'opportunities'].includes(group.kind));
  const venue = text(row, 'venue'); const city = text(row, 'city'); const coordinates = row['format'] === 'online' ? null : venueCoordinates(venue, city);
  const website = safeWebUrl(text(row, 'website')); const description = text(row, 'description');
  const dateKey = start ? dayKey(start, text(row, 'timezone') ?? undefined) : '';
  return <article className="nb-container nb-section nb-venture-detail">
    <OrganisationCover image={text(row, 'cover_image_url')} website={text(row, isOrg ? 'website' : 'registration_url') ?? text(row, 'source_url')} fallback={<SpecimenCard name={profile.title} terms={terms} />} />
    <div className="mb-8">{isOrg ? <Link to="/explore" search={EMPTY_SEARCH} className="nb-link">Explore</Link> : <Link to="/events" search={{ type: '', city: '', month: '', archive: false, view: 'list' }} className="nb-link">Events</Link>}</div>
    <header data-profile-identity data-profile-detail={isOrg ? [label, city].filter(Boolean).join(', ') : label} className="nb-detail-identity">
      {!isOrg && dateKey && <div className="nb-calendar-tile" aria-label={dateLabel(start ?? '')}><span>{Number(dateKey.slice(8))}</span><p>{new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${dateKey}T12:00:00Z`))}</p></div>}
      <div className="min-w-0"><h1 data-page-title className="nb-h1 break-words">{profile.title}</h1>{!isOrg && days !== null && <p className="nb-countdown mt-4">{days > 0 ? `In ${days} ${days === 1 ? 'day' : 'days'}` : days === 0 ? 'Today' : text(row, 'ends_at') && Date.parse(String(row['ends_at'])) >= Date.parse(now) ? 'Happening now' : 'Past event'}</p>}{profile.summary && <p className="nb-lead mt-5">{profile.summary}</p>}</div>
    </header>
    {!isOrg && <CalendarActions profile={profile} />}
    {isOrg && <dl className="nb-facts-strip">{facts.filter(([, value]) => value).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>}
    {description && description !== profile.summary && <p className="nb-body nb-detail-description">{description}</p>}
    {steps.length > 0 && <section className="nb-detail-section"><h2 className="nb-h2 mb-5">{isOrg ? 'Useful if you are…' : 'Go if you are…'}</h2><ul className="nb-journey-sentences">{steps.map(step => <li key={step.id}>{step.name}<span className="nb-small text-muted-foreground">{isOrg ? 'Explore their work at this stage.' : 'Meet others working at this stage.'}</span></li>)}</ul></section>}
    {!isOrg && <dl className="nb-facts-strip">{facts.filter(([, value]) => value).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>}
    {isOrg && connections.length > 0 && <section className="nb-detail-section"><h2 className="nb-h2">Connections</h2><RelationshipMap profile={connectionProfile} link={(kind, entry) => <DetailLink item={{ ...entry, kind }}>{entry.title}</DetailLink>} /><div className="nb-connection-lists">{connections.map(group => <div key={group.label}><h3 className="nb-h3 mb-4">{group.label}</h3><ul className="space-y-3">{group.entries.map(entry => <li key={entry.id}><DetailLink item={{ ...entry, kind: group.kind }}>{entry.title}</DetailLink></li>)}</ul></div>)}</div></section>}
    {isOrg && detail && <Recommendations title="Coming up with them" items={detail.coming} now={now} />}
    {!isOrg && coordinates && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Venue</h2><ClientOnly fallback={null}><Suspense fallback={null}><MapView latitude={coordinates[0]} longitude={coordinates[1]} name={venue ?? city ?? ''} /></Suspense></ClientOnly><a className="nb-link nb-small mt-3 inline-block" href={`https://www.openstreetmap.org/?mlat=${coordinates[0]}&mlon=${coordinates[1]}#map=16/${coordinates[0]}/${coordinates[1]}`} target="_blank" rel="noopener noreferrer">Open venue map</a></section>}
    {!isOrg && connections.length > 0 && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Organiser</h2><div className="grid gap-5 sm:grid-cols-2">{connections.flatMap(group => group.entries).map(entry => <article className="nb-card" key={entry.id}><OrganisationLogo name={entry.title} slug={entry.slug} /><h3 className="nb-h3 mt-4"><DetailLink item={{ ...entry, kind: 'organisations' }}>{entry.title}</DetailLink></h3>{entry.summary && <p className="nb-small mt-3">{entry.summary}</p>}</article>)}</div></section>}
    {!isOrg && detail && <Recommendations title="Same week" items={detail.sameWeek} now={now} />}
    {!isOrg && Boolean(detail?.guides.length) && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Prepare</h2><ul className="space-y-5">{detail?.guides.map(guide => <li key={guide.slug}><h3 className="nb-h3"><Link to="/learn/$slug" params={{ slug: guide.slug }} className="nb-link">{guide.title}</Link></h3>{guide.summary && <p className="nb-small mt-2">{guide.summary}</p>}</li>)}</ul></section>}
    {isOrg && Boolean(detail?.similar.length) && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Similar in the Nordics</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{detail?.similar.map(entry => <article key={entry.id} className="nb-card"><OrganisationLogo name={entry.title} slug={entry.slug} /><h3 className="nb-h3 mt-4"><DetailLink item={{ ...entry, kind: 'organisations' }}>{entry.title}</DetailLink></h3>{entry.summary && <p className="nb-small mt-3">{entry.summary}</p>}</article>)}</div></section>}
    {otherGroups.map(group => <section className="nb-detail-section" key={group.label}><h2 className="nb-h2 mb-5">{group.label}</h2><ul className="space-y-3">{group.entries.map(entry => <li key={entry.id}>{group.kind === 'episodes' ? <Link to="/podcast/$slug" params={{ slug: entry.slug }} className="nb-link">{entry.title}</Link> : <DetailLink item={{ ...entry, kind: group.kind }}>{entry.title}</DetailLink>}</li>)}</ul></section>)}
    <footer className="nb-detail-section"><div className="nb-detail-actions">{isOrg && website && <Button asChild variant="ghost" className="nb-btn nb-btn-primary"><a href={website} target="_blank" rel="noopener noreferrer">Visit website</a></Button>}<Button asChild variant="ghost" className="nb-btn nb-btn-secondary"><Link to="/newsletter">Get the newsletter</Link></Button><Button asChild variant="ghost" className="nb-btn nb-btn-secondary"><Link to="/submit" search={{ tab: 'correction' }}>Suggest an edit</Link></Button></div>{text(row, 'last_checked') && <p className="nb-small text-muted-foreground mt-5">Last checked {dateLabel(String(row['last_checked']))}</p>}</footer>
  </article>;
}