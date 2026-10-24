import { officialLogo, brandColour } from '@/lib/brand';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { CalendarMenu } from './CalendarMenu';
import { countdownLabel, daysUntil, googleMapsUrl, registrationClosed, type CalendarEvent } from '@/lib/detail';
import { dateLabel, dayKey } from '@/lib/events';
import { humanize } from '@/lib/admin/entities';
import { EMPTY_SEARCH } from '@/lib/explore';
import { safeWebUrl, text, type DetailItem, type PublicProfile, type RelatedEntry } from '@/lib/profiles';
import { useSaved } from '@/lib/saved';
import { OrganisationCover } from './OrganisationCover';
import { OrganisationLogo } from './OrganisationLogo';
import { officialVideo } from '@/lib/video';
import { VideoEmbed } from './VideoEmbed';
import { NewsSection, ResearchSection, TrialsSection, asResearch } from './OpenDataSections';
import { ytjRecordUrl, type NewsItem } from '@/lib/enrich';
import { RelationshipMap } from './RelationshipMap';

const SITE = 'https://nordic-heartbeat.lovable.app';
function DetailLink({ item, children }: { item: RelatedEntry & { kind: string }; children: React.ReactNode }) {
  if (item.kind === 'organisations') return <Link to="/org/$slug" params={{ slug: item.slug }} className="nb-link">{children}</Link>;
  if (item.kind === 'events') return <Link to="/event/$slug" params={{ slug: item.slug }} className="nb-link">{children}</Link>;
  if (item.kind === 'opportunities') return <Link to="/opportunity/$slug" params={{ slug: item.slug }} className="nb-link">{children}</Link>;
  return <Link to="/person/$slug" params={{ slug: item.slug }} className="nb-link">{children}</Link>;
}
const itemPath = (item: DetailItem) => `${SITE}/${item.kind === 'events' ? 'event' : 'opportunity'}/${encodeURIComponent(item.slug)}`;
function SaveShare({ kind, slug, title }: { kind: 'organisation' | 'event'; slug: string; title: string }) {
  const { saved, toggle } = useSaved(kind, slug, title); const [message, setMessage] = useState('');
  return <><Button variant="ghost" className="nb-btn nb-btn-secondary" aria-pressed={saved} onClick={toggle}>{saved ? 'Saved' : 'Save'}</Button>
    <Button variant="ghost" className="nb-btn nb-btn-secondary" onClick={async () => { try { if (navigator.share) await navigator.share({ title, url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); setMessage('Link copied'); } } catch { setMessage(''); } }}>Share</Button>
    {message && <span className="nb-small" role="status">{message}</span>}</>;
}
function Countdown({ date, now, timezone }: { date: string | null; now: string; timezone?: string | undefined }) {
  const label = countdownLabel(date, now, timezone); const days = daysUntil(date, now, timezone);
  if (!label) return null;
  return <span className={`nb-countdown${days !== null && days < 14 ? ' nb-countdown-signal' : ''}`}>{label}</span>;
}
function OpenNow({ items, now }: { items: DetailItem[]; now: string }) {
  if (!items.length) return null;
  return <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Open now</h2><ul className="nb-detail-list">{items.map(item => {
    const cal: CalendarEvent | null = item.date ? { id: item.id, title: item.kind === 'opportunities' ? `Deadline: ${item.title}` : item.title, start: item.date, end: item.kind === 'events' ? item.end : null, allDay: item.kind === 'opportunities', location: item.city ?? '', description: item.summary ?? '', url: itemPath(item) } : null;
    return <li key={`${item.kind}:${item.id}`}><div className="min-w-0"><p className="nb-small text-muted-foreground">{item.date ? `${item.kind === 'opportunities' ? 'Closes ' : ''}${dateLabel(item.date)}` : 'Rolling, apply any time'}{item.type ? `, ${humanize(item.type)}` : ''}</p><h3 className="nb-h3 mt-2"><DetailLink item={item}>{item.title}</DetailLink></h3></div>
      <div className="flex flex-wrap items-center gap-3"><Countdown date={item.date} now={now} />{cal && <CalendarMenu event={cal} slug={item.slug} />}</div></li>;
  })}</ul></section>;
}
const LastLine = ({ checked, isOrg, title, slug }: { checked: string | null; isOrg: boolean; title: string; slug: string }) =>
  <p className="nb-small text-muted-foreground nb-detail-lastline">{checked ? `Last checked ${dateLabel(checked)}. ` : ''}Something wrong? <Link className="nb-link" to="/submit" search={{ tab: isOrg ? 'company' : 'event', edit: title, entryUrl: `${SITE}/${isOrg ? 'org' : 'event'}/${encodeURIComponent(slug)}` }}>Suggest an edit.</Link></p>;

export function VentureDetail({ profile }: { profile: PublicProfile }) {
  const { row, terms, detail } = profile; const isOrg = profile.kind === 'organisations';
  const now = detail?.now ?? ''; const start = text(row, 'starts_at'); const timezone = text(row, 'timezone') ?? undefined;
  const steps = terms.filter(term => term.kind === 'journey_step');
  const names = (kind: string) => terms.filter(term => term.kind === kind).map(term => term.name).join(', ') || null;
  const fields = terms.filter(term => term.kind === 'field');
  const label = humanize(text(row, isOrg ? 'type' : 'event_type') ?? '');
  const businessId = isOrg ? text(row, 'business_id') : null; const registered = text(row, 'registration_date');
  const city = text(row, 'city'); const venue = text(row, 'venue'); const online = row['format'] === 'online';
  const place = [city, names('country')].filter(Boolean).join(', ');
  const connections = profile.related.filter(group => group.kind === 'organisations'); const connectionProfile = { ...profile, related: connections };
  const otherGroups = profile.related.filter(group => !['organisations', 'events', 'opportunities'].includes(group.kind));
  const research = isOrg ? asResearch(row['research']) : null; const trials = isOrg && Array.isArray(row['trials']) ? row['trials'] as unknown as Parameters<typeof TrialsSection>[0]['trials'] : []; const news = isOrg && Array.isArray(row['news_items']) ? row['news_items'] as unknown as NewsItem[] : [];
  const website = safeWebUrl(text(row, 'website')); const description = text(row, 'description');
  const video = officialVideo(text(row, 'video_url'), text(row, 'video_source_url'));
  const accent = isOrg ? brandColour(row['brand_accent']) : null;
  const logo = <OrganisationLogo name={profile.title} uploaded={isOrg ? text(row,'logo_url') : officialLogo(text(row,'logo_url'), text(row,'registration_url') ?? text(row,'source_url'), text(row,'logo_image_source'), text(row,'logo_image_source_url'))} website={text(row,isOrg ? 'website' : 'registration_url') ?? text(row,'source_url')} choice={isOrg ? (text(row,'logo_choice') ?? 'icon') : 'verified'} large eager />;
  const organisers = connections.flatMap(group => group.entries);
  const organiser = organisers.find(entry => entry.roles.some(role => /organi[sz]er|host/i.test(role))) ?? organisers[0];
  const register = safeWebUrl(text(row, 'registration_url')); const eventSite = safeWebUrl(text(row, 'source_url'));
  const closed = registrationClosed(text(row, 'apply_deadline_at'), start, now || new Date().toISOString());
  const calendar: CalendarEvent | null = !isOrg && start && Number.isFinite(Date.parse(start)) ? { id: row.id, title: profile.title, start, end: text(row, 'ends_at'), location: online ? 'Online' : [venue, city].filter(Boolean).join(', '), description: profile.summary ?? '', url: `${SITE}/event/${encodeURIComponent(row.slug)}` } : null;
  const tz = timezone ?? 'Europe/Helsinki';
  const parts = (opts: Intl.DateTimeFormatOptions) => start ? new Intl.DateTimeFormat('en-GB', { timeZone: tz, ...opts }).format(new Date(start)) : '';
  const happening = !isOrg && start && Date.parse(start) <= Date.parse(now) && text(row, 'ends_at') && Date.parse(String(row['ends_at'])) >= Date.parse(now);
  const mapsQuery = isOrg ? place : [venue, city].filter(Boolean).join(', ');
  const mapsLink = mapsQuery && !online ? <a className="nb-link nb-small ml-2" href={googleMapsUrl(mapsQuery)} target="_blank" rel="noopener noreferrer">Open in Google Maps</a> : null;

  const orgFacts: [string, React.ReactNode][] = [['Type', label], ['Location', place ? <>{place}{mapsLink}</> : null], ['Founded', row['founded_year'] ? String(row['founded_year']) : null], ['Stage', names('stage')], ['Business ID', businessId ? `${businessId}${registered ? `, registered ${registered.slice(0, 4)}` : ''}` : null]];
  const eventFacts: [string, React.ReactNode][] = [['Dates', start ? `${dateLabel(start, timezone)}${text(row, 'ends_at') && dayKey(String(row['ends_at'])) !== dayKey(start) ? ` to ${dateLabel(String(row['ends_at']), timezone)}` : ''}` : null], ['Where', online ? 'Online' : mapsQuery ? <>{mapsQuery}{mapsLink}</> : null], ['Type', label], ['Format', text(row, 'format') ? humanize(String(row['format'])) : null], ['Price', text(row, 'price_note')], ['Apply by', text(row, 'apply_deadline_at') ? dateLabel(String(row['apply_deadline_at'])) : null]];
  const facts = (isOrg ? orgFacts : eventFacts).filter(([, value]) => value);

  const actions = isOrg
    ? <div className="nb-detail-actions nb-action-bar">{website && <Button asChild variant="ghost" className="nb-btn nb-btn-primary"><a href={website} target="_blank" rel="noopener noreferrer">Visit website</a></Button>}<SaveShare kind="organisation" slug={row.slug} title={profile.title} /></div>
    : <div className="nb-detail-actions nb-action-bar">{closed ? <Button variant="ghost" className="nb-btn nb-btn-secondary" disabled>Registration closed</Button> : (register ?? eventSite) && <Button asChild variant="ghost" className="nb-btn nb-btn-primary"><a href={(register ?? eventSite)!} target="_blank" rel="noopener noreferrer">{register ? 'Register' : 'Event website'}</a></Button>}{calendar && !closed && <CalendarMenu event={calendar} slug={row.slug} />}<SaveShare kind="event" slug={row.slug} title={profile.title} /></div>;

  return <article className="nb-container nb-section nb-venture-detail" style={accent ? { '--official-brand-accent': accent } as React.CSSProperties : undefined}>
    <OrganisationCover image={text(row, 'cover_image_url')} website={text(row, 'image_source_url') ?? text(row, isOrg ? 'website' : 'registration_url') ?? text(row, 'source_url')} name={profile.title} />
    <div className="mb-8">{isOrg ? <Link to="/explore" search={EMPTY_SEARCH} className="nb-link">Explore</Link> : <Link to="/events" search={{ type: '', city: '', month: '', archive: false, view: 'list' }} className="nb-link">Events</Link>}</div>
    <header data-profile-identity data-profile-detail={isOrg ? [label, city].filter(Boolean).join(', ') : label} className="nb-detail-identity">
      {isOrg ? logo : start && <div className="nb-calendar-tile" aria-hidden="true"><span>{parts({ day: 'numeric' })}</span><p>{parts({ month: 'long' })}, {parts({ weekday: 'long' })}</p></div>}
      <div className="min-w-0 flex-1">
        <h1 data-page-title className="nb-h1 break-words">{profile.title}</h1>
        {!isOrg && <div className="mt-4">{happening ? <span className="nb-countdown">Happening now</span> : <Countdown date={start} now={now} timezone={timezone} />}</div>}
        {profile.summary && <p className="nb-lead mt-5">{profile.summary}</p>}
        {!isOrg && organiser && <div className="nb-detail-organiser"><OrganisationLogo name={organiser.title} slug={organiser.slug} /><span className="nb-small">By <DetailLink item={{ ...organiser, kind: 'organisations' }}>{organiser.title}</DetailLink></span></div>}
        <dl className="nb-facts-strip">{facts.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
        {fields.length > 0 && <ul className="nb-detail-chips" aria-label="Fields">{fields.map(field => <li key={field.id} className="nb-reason-chip">{field.name}</li>)}</ul>}
        {businessId && <p className="nb-registry-note">Verified in the Finnish Trade Register. <a className="nb-link" href={ytjRecordUrl(businessId)} target="_blank" rel="noopener noreferrer">View the official YTJ record</a></p>}
      </div>
    </header>
    {actions}
    {isOrg && detail && <OpenNow items={detail.coming} now={now} />}
    {!isOrg && steps.length > 0 && <section className="nb-detail-section"><h2 className="nb-h2 mb-5">Who it is for</h2><ul className="nb-detail-chips">{steps.map(step => <li key={step.id} className="nb-reason-chip">{journeySentence(step.name).replace(/\.$/, '')}</li>)}</ul></section>}
    {description && description !== profile.summary && <p className="nb-body nb-detail-description">{description}</p>}
    {isOrg && connections.length > 0 && <section className="nb-detail-section"><h2 className="nb-h2">Connections</h2><RelationshipMap profile={connectionProfile} link={(kind, entry) => <DetailLink item={{ ...entry, kind }}>{entry.title}</DetailLink>} /><div className="nb-connection-lists">{connections.map(group => <div key={group.label}><h3 className="nb-h3 mb-4">{group.label === 'Partners' ? 'Partners' : group.label}</h3><ul className="space-y-3">{group.entries.map(entry => <li key={entry.id} className="flex items-center gap-3"><OrganisationLogo name={entry.title} slug={entry.slug} /><DetailLink item={{ ...entry, kind: group.kind }}>{entry.title}</DetailLink></li>)}</ul></div>)}</div></section>}
    {isOrg && Boolean(detail?.similar.length) && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Close to them</h2><div className="nb-close-grid">{detail?.similar.map(entry => <article key={entry.id} className="nb-card"><OrganisationLogo name={entry.title} slug={entry.slug} /><h3 className="nb-h3 mt-4"><DetailLink item={{ ...entry, kind: 'organisations' }}>{entry.title}</DetailLink></h3>{entry.roles[0] && <p className="mt-3"><span className="nb-reason-chip">{entry.roles[0]}</span></p>}</article>)}</div></section>}
    {Boolean(detail?.guides.length) && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">{isOrg ? 'Learn' : 'Prepare'}</h2><ul className="space-y-5">{detail?.guides.map(guide => <li key={guide.slug}><h3 className="nb-h3"><Link to="/learn/$slug" params={{ slug: guide.slug }} className="nb-link">{guide.title}</Link></h3>{guide.summary && <p className="nb-small mt-2">{guide.summary}</p>}</li>)}</ul></section>}
    {!isOrg && Boolean(detail?.sameWeek.length) && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Same week</h2><ul className="nb-compact-list">{detail?.sameWeek.map(item => <li key={item.id}><span className="nb-small text-muted-foreground">{item.date ? dateLabel(item.date) : ''}</span><span><DetailLink item={item}>{item.title}</DetailLink>{item.type ? <span className="nb-small text-muted-foreground">, {humanize(item.type)}</span> : null}</span></li>)}</ul></section>}
    {video && <section className="nb-detail-section"><h2 className="nb-h2 mb-6">Watch</h2><VideoEmbed video={video} title={profile.title} channel={text(row, 'video_source_url')} /></section>}
    {research && <ResearchSection research={research} />}
    <TrialsSection trials={trials} />
    <NewsSection items={news} />
    {otherGroups.map(group => <section className="nb-detail-section" key={group.label}><h2 className="nb-h2 mb-5">{group.label}</h2><ul className="space-y-3">{group.entries.map(entry => <li key={entry.id}>{group.kind === 'episodes' ? <Link to="/podcast/$slug" params={{ slug: entry.slug }} className="nb-link">{entry.title}</Link> : <DetailLink item={{ ...entry, kind: group.kind }}>{entry.title}</DetailLink>}</li>)}</ul></section>)}
    <LastLine checked={text(row, 'last_checked')} isOrg={isOrg} title={profile.title} slug={row.slug} />
  </article>;
}
function journeySentence(name: string) {
  const sentences: Record<string, string> = { funding: 'Looking for funding.', growth: 'Growing your venture.', validation: 'Validating your idea.', idea: 'Developing an idea.', research: 'Turning research into a venture.', team: 'Building your team.', launch: 'Preparing to launch.', regulation: 'Working through regulation.' };
  return sentences[name.toLowerCase()] ?? `Working on ${name.charAt(0).toLowerCase()}${name.slice(1)}.`;
}