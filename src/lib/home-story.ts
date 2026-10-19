import type { EventsData } from './events';
import type { OpportunitiesData } from './opportunities';
export function networkScrollPhases(progress: number, edges: number, reduced = false) {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  return reduced ? { entry: 1, connections: edges, labels: 1 } : {
    entry: clamp(progress / 0.4),
    connections: clamp((progress - 0.4) / 0.4) * edges,
    labels: clamp((progress - 0.8) / 0.2),
  };
}
export function happeningItems(events: EventsData, opportunities: OpportunitiesData) {
  const now = Date.parse(events.now);
  return [
    ...events.events.flatMap(e => [
      { id: `event:${e.id}`, slug: e.slug, title: e.title, date: e.starts_at, type: e.event_type.replaceAll('_', ' '), kind: 'event' as const },
      { id: `application:${e.id}`, slug: e.slug, title: e.title, date: e.apply_deadline_at, type: 'Application deadline', kind: 'event' as const },
    ]),
    ...opportunities.opportunities.map(o => ({ id: `opportunity:${o.id}`, slug: o.slug, title: o.title, date: o.deadline_at, type: `${o.type.replaceAll('_', ' ')} deadline`, kind: 'opportunity' as const })),
  ].filter((item): item is typeof item & { date: string } => Boolean(item.date && Date.parse(item.date) >= now))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date) || a.id.localeCompare(b.id));
}