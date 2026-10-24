import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY, type SimulationNodeDatum } from 'd3-force';
import { publicTitle } from './profiles';

export const ECOSYSTEM_GROUPS = [
  'Startups', 'Investors', 'Incubators and accelerators', 'Funders and grants',
  'Universities and research', 'Labs and validation', 'Hospitals and care',
  'Public agencies', 'Patient organisations', 'Communities and events', 'Service providers',
] as const;
export type NetworkKind = 'organisation' | 'event' | 'opportunity';
export interface NetworkEntry { id: string; slug: string; name: string; type: string; kind: NetworkKind; status: string }
export interface NetworkNode extends SimulationNodeDatum { id: string; slug: string; name: string; type: string; kind: NetworkKind; group: number }
export interface NetworkEdge { source: string; target: string; relation: string }
export interface NetworkData { nodes: NetworkNode[]; links: NetworkEdge[] }
export const nodeId = (kind: NetworkKind, id: string) => `${kind}:${id}`;
const ORG_GROUP: Record<string, number> = { startup: 0, investor: 1, incubator: 2, accelerator: 2, funder: 3, university: 4, research_group: 4, lab: 5, hospital_innovation_unit: 6, care_provider: 6, public_agency: 7, patient_organisation: 8, community: 9, service_provider: 10 };
export function networkGroup(kind: NetworkKind, type: string): number {
  if (kind === 'event') return 9;
  if (kind === 'opportunity') return type === 'grant_call' ? 3 : type === 'programme_intake' ? 2 : type === 'job' ? 10 : 9;
  return ORG_GROUP[type] ?? 10;
}
export function buildNetwork(entries: NetworkEntry[], edges: NetworkEdge[]): NetworkData {
  const nodes = entries.filter(e => e.status === 'published').map(e => ({ id: nodeId(e.kind, e.id), slug: e.slug, name: publicTitle(e.name), type: e.type.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()), kind: e.kind, group: networkGroup(e.kind, e.type) })).sort((a, b) => a.name.localeCompare(b.name));
  const ids = new Set(nodes.map(n => n.id));
  const seen = new Set<string>();
  const links = edges.filter(e => {
    if (!ids.has(e.source) || !ids.has(e.target) || e.source === e.target || !['invested_in', 'partner_of', 'organiser_of', 'provider_of'].includes(e.relation)) return false;
    const pair = e.relation === 'partner_of' ? [e.source, e.target].sort() : [e.source, e.target];
    const key = `${pair.join('|')}|${e.relation}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  return { nodes, links };
}
export const profileHref = (n: NetworkNode) => `/${n.kind === 'organisation' ? 'org' : n.kind}/${encodeURIComponent(n.slug)}`;
export function layoutNetwork(data: NetworkData, width: number, height: number) {
  const nodes = data.nodes.map(n => ({ ...n }));
  if (!nodes.length) return nodes;
  const links = data.links.map(e => ({ ...e }));
  const simulation = forceSimulation(nodes).stop()
    .force('link', forceLink<NetworkNode, { source: string | NetworkNode; target: string | NetworkNode }>(links).id(n => n.id).distance(95).strength(.35))
    .force('charge', forceManyBody().strength(-300))
    .force('collision', forceCollide(32))
    .force('x', forceX<NetworkNode>(n => Math.cos(n.group / 11 * Math.PI * 2) * 150).strength(.035))
    .force('y', forceY<NetworkNode>(n => Math.sin(n.group / 11 * Math.PI * 2) * 130).strength(.035));
  simulation.tick(300);
  const xs = nodes.map(n => n.x ?? 0), ys = nodes.map(n => n.y ?? 0);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 30;
  const scale = Math.min(Math.max(1, width - pad * 2) / Math.max(1, maxX - minX), Math.max(1, height - pad * 2) / Math.max(1, maxY - minY));
  return nodes.map(n => ({ ...n, x: width / 2 + ((n.x ?? 0) - (minX + maxX) / 2) * scale, y: height / 2 + ((n.y ?? 0) - (minY + maxY) / 2) * scale }));
}
export function networkTiming(elapsed: number, reduced: boolean, edgeCount: number) {
  return reduced ? { entry: 1, connections: edgeCount } : { entry: Math.min(1, Math.max(0, elapsed / 2500)), connections: Math.min(edgeCount, Math.max(0, (elapsed - 2500) / 140)) };
}
export const GROUP_TYPES = [['startup'], ['investor'], ['incubator', 'accelerator'], ['funder'], ['university', 'research_group'], ['lab'], ['hospital_innovation_unit', 'care_provider'], ['public_agency'], ['patient_organisation'], ['community'], ['service_provider']];
export const GROUP_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 3], [4, 5], [4, 6], [7, 3], [7, 6], [8, 6], [8, 0],
  ...Array.from({ length: 11 }, (_, i): [number, number] => [9, i]).filter(([, i]) => i !== 9),
];
export function groupCounts(data: NetworkData) {
  return ECOSYSTEM_GROUPS.map((_, group) => data.nodes.filter(node => node.group === group).length);
}
export function groupHref(group: number) {
  return `/explore?type=${encodeURIComponent(JSON.stringify(GROUP_TYPES[group] ?? []))}`;
}
export function groupPositions(width: number, height: number) {
  const coords = width < 600
    ? [[.5,.47],[.25,.12],[.75,.12],[.25,.29],[.75,.29],[.75,.65],[.25,.65],[.25,.82],[.75,.82],[.25,.95],[.75,.95]]
    : [[.5,.48],[.28,.32],[.7,.3],[.5,.12],[.83,.52],[.73,.77],[.5,.85],[.15,.62],[.25,.85],[.15,.12],[.85,.12]];
  return coords.map(([x = .5, y = .5]) => ({ x: width * x, y: 28 + (height - 75) * y }));
}export interface GroupOrg { slug: string; name: string; type: string; website: string | null; logo_url: string | null; logo_choice: string | null; links: number }
export interface EcosystemGroup { group: number; name: string; count: number; href: string; orgs: GroupOrg[] }
/** Organisation-only groups, largest first, empty groups hidden; up to `limit` orgs per group, most connected first. */
export function buildGroups(orgs: GroupOrg[], limit = 6): EcosystemGroup[] {
  return ECOSYSTEM_GROUPS.map((name, group) => {
    const members = orgs.filter(o => networkGroup('organisation', o.type) === group);
    const ranked = [...members].sort((a, b) => b.links - a.links || Number(Boolean(b.logo_url)) - Number(Boolean(a.logo_url)) || a.name.localeCompare(b.name));
    return { group, name, count: members.length, href: groupHref(group), orgs: ranked.filter(o => o.website || o.logo_url).slice(0, limit) };
  }).filter(g => g.count > 0).sort((a, b) => b.count - a.count || a.group - b.group);
}
