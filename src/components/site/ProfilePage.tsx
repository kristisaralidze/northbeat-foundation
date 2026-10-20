import { Link, useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Building2, UserRound, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { humanize, type EntityKey } from '@/lib/admin/entities';
import { EMPTY_SEARCH } from '@/lib/explore';
import { safeWebUrl, text, type PublicProfile, type RelatedEntry } from '@/lib/profiles';
import { RelationshipMap } from './RelationshipMap';
import { OrganisationLogo } from './OrganisationLogo';
import { OrganisationCover } from './OrganisationCover';
import { SpecimenCard } from './SpecimenCard';
import { organisationDomain } from '@/lib/organisation-logo';
import { relationshipNodes, publicProfileTerms } from '@/lib/profiles';
import { VentureDetail } from './VentureDetail';

export function EntryLink({ kind, entry, children, className }: { kind: EntityKey; entry: { slug: string }; children: ReactNode; className?: string }) {
  const props = { params: { slug: entry.slug }, className, children };
  switch (kind) {
    case 'organisations': return <Link to="/org/$slug" {...props} />;
    case 'people': return <Link to="/person/$slug" {...props} />;
    case 'events': return <Link to="/event/$slug" {...props} />;
    case 'opportunities': return <Link to="/opportunity/$slug" {...props} />;
    case 'episodes': return <Link to="/podcast/$slug" {...props} />;
    default: return <span className={className}>{children}</span>;
  }
}
function ProfileImage({ image, name, kind, small = false }: { image: string | null; name: string; kind: EntityKey; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  const Icon = kind === 'people' ? UserRound : kind === 'episodes' ? Radio : Building2;
  return <div className={small || kind === 'organisations' && (!image || failed) ? 'nb-org-logo shrink-0' : 'nb-profile-image'}>
    {image && !failed ? <img src={image} alt={kind === 'people' ? name : `${name} ${kind === 'episodes' ? 'cover' : 'logo'}`} onError={() => setFailed(true)} className={kind === 'people' ? 'h-full w-full object-cover' : 'h-full w-full object-contain'} /> : kind === 'organisations' ? <span className="nb-monogram" aria-hidden>{name.charAt(0)}</span> : <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />}
  </div>;
}
function RelatedCard({ kind, entry }: { kind: EntityKey; entry: RelatedEntry }) {
  return <article className="nb-card flex min-w-0 flex-col gap-4">
    {kind === 'organisations' ? <OrganisationLogo name={entry.title} slug={entry.slug} /> : ['people', 'episodes'].includes(kind) && <ProfileImage image={entry.image} name={entry.title} kind={kind} small />}
    {entry.roles.length > 0 && <p className="nb-small text-muted-foreground break-words">{entry.roles.map(humanize).join(' · ')}</p>}
    <h3 className="nb-h3"><EntryLink kind={kind} entry={entry} className="nb-org-link break-words">{entry.title}<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden /></EntryLink></h3>
    {entry.summary && <p className="nb-small text-muted-foreground break-words">{entry.summary}</p>}
  </article>;
}
function WebLink({ url, children }: { url: string | null; children: ReactNode }) {
  const href = safeWebUrl(url);
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="nb-link inline-flex items-center gap-2">{children}<ArrowUpRight className="h-4 w-4" aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a> : null;
}
function date(value: string | null, timezone?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  try { return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: timezone ?? 'UTC' }).format(parsed); } catch { return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(parsed); }
}
export function ProfilePage({ profile }: { profile: PublicProfile }) {
  if (profile.kind === 'organisations' || profile.kind === 'events') return <VentureDetail profile={profile} />;
  return <StandardProfilePage profile={profile} />;
}
function StandardProfilePage({ profile }: { profile: PublicProfile }) {
  const { row, kind } = profile;
  const isOrg = kind === 'organisations';
  const isPerson = kind === 'people';
  const description = text(row, isPerson ? 'bio' : kind === 'episodes' ? 'show_notes' : 'description');
  const email = text(row, 'contact_email');
  const openTo = Array.isArray(row['open_to']) ? row['open_to'].filter((value): value is string => typeof value === 'string') : [];
  const compactDetails = isOrg || kind === 'events' || kind === 'opportunities';
  const tags = publicProfileTerms(profile.terms);
  const connectionCount = relationshipNodes(profile).length;
  const facts: [string, string | null][] = isOrg ? [['Location', text(row, 'city')], ['Founded', row['founded_year'] ? String(row['founded_year']) : null]] : kind === 'events' ? [
    ['Starts', date(text(row, 'starts_at'), text(row, 'timezone'))], ['Ends', date(text(row, 'ends_at'), text(row, 'timezone'))], ['Apply by', date(text(row, 'apply_deadline_at'), text(row, 'timezone'))], ['Location', [text(row, 'venue'), text(row, 'city')].filter(Boolean).join(', ') || null], ['Format', text(row, 'format') ? humanize(String(row['format'])) : null], ['Price', text(row, 'price_note')]
  ] : kind === 'opportunities' ? [['Opens', date(text(row, 'opens_at'))], ['Deadline', date(text(row, 'deadline_at'))], ['Location', text(row, 'location')], ['Employment', text(row, 'employment_type')]] : kind === 'episodes' ? [['Episode', row['episode_number'] ? String(row['episode_number']) : null], ['Published', date(text(row, 'published_on'))]] : [];
  const label = isPerson ? 'Person' : kind === 'episodes' ? 'Podcast' : humanize(text(row, kind === 'events' ? 'event_type' : 'type') ?? kind);
  const details = <aside className="min-w-0 space-y-4" aria-label="Details and contact">
    {facts.some(([, value]) => value) && <dl className={compactDetails ? 'flex flex-wrap gap-x-8 gap-y-3' : 'space-y-4'}>{facts.filter(([, value]) => value).map(([name, value]) => <div key={name}><dt className="nb-small text-muted-foreground">{name}</dt><dd className="nb-small break-words">{value}</dd></div>)}</dl>}
    <div className="nb-small flex flex-wrap items-center gap-x-6 gap-y-3">
      {safeWebUrl(text(row, 'website')) && <span><span className="text-muted-foreground">Website: </span><WebLink url={text(row, 'website')}>{organisationDomain(text(row, 'website')) || 'Website'}</WebLink></span>}
      <WebLink url={text(row, 'linkedin_url')}>LinkedIn</WebLink><WebLink url={text(row, 'registration_url')}>Register</WebLink><WebLink url={text(row, 'apply_url')}>Apply</WebLink>{kind !== 'episodes' && <WebLink url={text(row, 'embed_url')}>Listen to episode</WebLink>}
      {email && <a href={`mailto:${encodeURIComponent(email)}`} className="nb-link break-all">{email}</a>}
    </div>
    {text(row, 'last_checked') && <p className="nb-small text-muted-foreground">Last checked {date(text(row, 'last_checked'))}</p>}
  </aside>;
  return <article className="nb-container nb-section">
    {(isOrg || kind === 'events') && <OrganisationCover image={text(row, 'cover_image_url')} website={text(row, isOrg ? 'website' : 'source_url')} fallback={<SpecimenCard name={profile.title} terms={profile.terms} />} />}
    <div className="mb-8"><Link to="/explore" search={EMPTY_SEARCH} className="nb-link inline-flex items-center gap-2"><ArrowLeft className="h-4 w-4" aria-hidden />Explore</Link></div>
    <header data-profile-identity data-profile-detail={isOrg ? [label, text(row, 'city')].filter(Boolean).join(', ') : undefined} className="pb-10">
      <div className={isOrg ? 'flex items-start gap-4' : 'flex flex-col gap-6 sm:flex-row sm:items-start'}>
        {isOrg ? <OrganisationLogo name={profile.title} slug={profile.row.slug} uploaded={profile.image} website={text(row, 'website')} eager /> : (isPerson || (profile.image && kind !== 'episodes')) && <ProfileImage image={profile.image} name={profile.title} kind={kind} />}
        <div className="min-w-0 flex-1"><h1 data-page-title className="nb-h1 break-words">{profile.title}</h1><p className="nb-small mt-3 text-muted-foreground">{label}</p>{profile.summary && kind !== 'episodes' && <p className="nb-lead mt-4 break-words">{profile.summary}</p>}</div>
      </div>
      {compactDetails && <div className="mt-6">{details}</div>}
      {tags.length > 0 && <div className="mt-6 flex flex-wrap gap-2" aria-label="Tags">{tags.map((term) => <span key={term.id} className="nb-chip max-w-full"><span className="truncate">{term.name}</span></span>)}</div>}
    </header>
    {isOrg && <RelationshipMap profile={profile} link={(relatedKind, entry) => <EntryLink kind={relatedKind} entry={entry} className="nb-link">{entry.title}</EntryLink>} />}
    {kind === 'episodes' && safeWebUrl(text(row, 'embed_url')) && <div className="mt-10 aspect-video w-full overflow-hidden rounded-[var(--radius)] border border-hairline"><iframe src={safeWebUrl(text(row, 'embed_url')) ?? undefined} title={`Watch ${profile.title}`} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" /></div>}
    <div className={compactDetails ? 'max-w-3xl pb-8' : 'nb-profile-layout py-10'}>
      {!(isOrg && !description) && <section className="min-w-0" aria-label={isPerson ? 'Biography' : 'Description'}>
        {kind === 'episodes' && profile.summary && <section className="mb-8"><h2 className="nb-h3 mb-3">Key takeaways</h2><p className="nb-body whitespace-pre-wrap break-words">{profile.summary}</p></section>}
        {description && <>{kind === 'episodes' && <h2 className="nb-h3 mb-3">Show notes</h2>}<p className="nb-body whitespace-pre-wrap break-words">{description}</p></>}
        {isPerson && text(row, 'expertise_note') && <section className="mt-8"><h2 className="nb-h3 mb-3">Expertise</h2><p className="nb-body whitespace-pre-wrap break-words">{text(row, 'expertise_note')}</p></section>}
        {openTo.length > 0 && <section className="mt-8"><h2 className="nb-h3 mb-3">Open to</h2><div className="flex flex-wrap gap-2">{openTo.map((value) => <span className="nb-chip nb-chip-frost" key={value}>{humanize(value)}</span>)}</div></section>}
        {kind === 'episodes' && safeWebUrl(text(row, 'audio_url')) && <audio controls preload="none" src={safeWebUrl(text(row, 'audio_url')) ?? undefined} className="mt-6 w-full" aria-label={`Listen to ${profile.title}`} />}
        {kind === 'episodes' && text(row, 'transcript') && <details className="mt-8 border-t border-hairline pt-6"><summary className="nb-h3 cursor-pointer">Transcript</summary><p className="nb-body mt-4 whitespace-pre-wrap break-words">{text(row, 'transcript')}</p></details>}
      </section>}
      {!compactDetails && details}
    </div>
    {profile.related.map((group) => <section key={`${group.kind}-${group.label}`} className="py-8"><h2 className="nb-h2 mb-6">{group.label}</h2>{isOrg && connectionCount < 3 ? <ul className="space-y-3">{group.entries.map(entry => <li key={entry.id} className="flex items-center gap-3">{group.kind === 'organisations' && <OrganisationLogo name={entry.title} slug={entry.slug} />}<EntryLink kind={group.kind} entry={entry} className="nb-link">{entry.title}</EntryLink></li>)}</ul> : <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{group.entries.map((entry) => <RelatedCard kind={group.kind} entry={entry} key={entry.id} />)}</div>}</section>)}
  </article>;
}
export function ProfileNotFound() { return <div className="nb-container nb-section"><h1 className="nb-h2">Profile not found</h1><p className="nb-body mt-4">This entry is unavailable or has not been published.</p><Link to="/explore" search={EMPTY_SEARCH} className="nb-link mt-6 inline-block">Back to Explore</Link></div>; }
export function ProfileError() {
  const router = useRouter(); const queryClient = useQueryClient();
  return <div className="nb-container nb-section"><h1 className="nb-h2">This profile didn’t load</h1><p className="nb-body mt-4 text-danger" role="alert">Please try again in a moment.</p><Button variant="ghost" className="nb-btn nb-btn-primary mt-6" onClick={async () => { await queryClient.resetQueries({ queryKey: ['public-profile'] }); await router.invalidate(); }}>Try again</Button></div>;
}
