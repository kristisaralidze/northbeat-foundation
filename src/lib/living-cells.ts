/** Conceptual group links are editorial, never organisation relationships. */
export const CELL_GROUPS = [
  { name: 'Startups', short: 'startups', types: ['startup'], tone: 'ink' },
  { name: 'Investors', short: 'investors', types: ['investor'], tone: 'money' },
  { name: 'Funders and grants', short: 'funders', types: ['funder'], tone: 'money' },
  { name: 'Incubators and accelerators', short: 'incubators', types: ['incubator', 'accelerator'], tone: 'support' },
  { name: 'Universities and research', short: 'universities', types: ['university', 'research_group'], tone: 'science' },
  { name: 'Hospitals and care', short: 'hospitals', types: ['hospital_innovation_unit', 'care_provider'], tone: 'science' },
  { name: 'Labs and validation', short: 'labs', types: ['lab'], tone: 'science' },
  { name: 'Public agencies', short: 'public agencies', types: ['public_agency'], tone: 'support' },
  { name: 'Patient organisations', short: 'patient organisations', types: ['patient_organisation'], tone: 'support' },
  { name: 'Service providers', short: 'service providers', types: ['service_provider'], tone: 'support' },
  { name: 'Communities and events', short: 'communities', types: ['community'], tone: 'support' },
] as const;
export interface CellOrganisation { id: string; slug: string; name: string; type: string; website: string | null; logo_url: string | null; logo_choice: string | null; status?: string }
export interface CellRelation { from_org_id: string; to_org_id: string; relation: string }
export interface CellData { organisations: CellOrganisation[]; relations: CellRelation[] }
export interface GroupLink { from: number; to: number; verb: string; sentence: string }
const EDITORIAL_LINKS: [number, string, number][] = [
  [1, 'invest in', 0], [2, 'give grants to', 0], [3, 'coach and support', 0], [4, 'spin out', 0],
  [5, 'run pilots with', 0], [6, 'test and validate products for', 0], [7, 'regulate', 0],
  [8, 'give feedback to', 0], [9, 'advise', 0], [10, 'connect', 0],
  [1, 'co-invest with', 2], [1, 'scout startups at', 3], [1, 'hire', 9],
  [2, 'fund research at', 4], [2, 'finance programmes at', 3], [2, 'fund projects at', 5],
  [3, 'grow out of', 4], [3, 'run innovation hubs with', 5], [4, 'do research with', 5],
  [4, 'run', 6], [5, 'validate products with', 6], [8, 'speak for patients at', 5],
  [8, 'advise', 7], [7, 'oversee', 5], [7, 'accredit', 6], [7, 'own and steer', 2],
  [10, 'are run by students from', 4], [10, 'bring in', 1], [10, 'partner with', 3],
  [10, 'make room for', 8], [9, 'prepare products for', 6], [9, 'teach at', 3],
];
export const CELL_LINKS: GroupLink[] = EDITORIAL_LINKS.map(([from, verb, to]) => ({ from, to, verb, sentence: `${CELL_GROUPS[from]?.short} ${verb} ${CELL_GROUPS[to]?.short}` }));
export function cellGroup(type: string) { return CELL_GROUPS.findIndex(g => (g.types as readonly string[]).includes(type)); }
export function safeCellData(data: CellData): CellData {
  const organisations = data.organisations.filter(o => (!o.status || o.status === 'published') && cellGroup(o.type) >= 0);
  const ids = new Set(organisations.map(o => o.id));
  return { organisations, relations: data.relations.filter(r => r.from_org_id !== r.to_org_id && ids.has(r.from_org_id) && ids.has(r.to_org_id)) };
}
export const cellHref = (group: number) => `/explore?type=${encodeURIComponent(JSON.stringify(CELL_GROUPS[group]?.types ?? []))}`;
export interface Point { x: number; y: number }
export interface Cell extends Point { group: number; radius: number; dotRadius: number; orgs: CellOrganisation[] }
export function layoutCells(data: CellData, width: number, height: number): Cell[] {
  const phone = width < 600, dotRadius = phone ? 2.2 : 2.8;
  const groups = CELL_GROUPS.map((_, group) => ({ group, orgs: data.organisations.filter(o => cellGroup(o.type) === group) })).filter(g => g.orgs.length);
  const outer = groups.filter(g => g.group !== 0);
  return groups.map(g => {
    const angle = -Math.PI / 2 + outer.findIndex(o => o.group === g.group) / Math.max(1, outer.length) * 2 * Math.PI;
    return { ...g, dotRadius, radius: .56 * 2.8 * dotRadius * Math.sqrt(g.orgs.length) + (g.group === 0 ? 16 : 12),
      x: width / 2 + (g.group === 0 ? 0 : Math.cos(angle) * (phone ? .36 * width : Math.min(.38 * width, 430))),
      y: height / 2 + 18 + (g.group === 0 ? 0 : Math.sin(angle) * (phone ? .32 : .31) * height) };
  });
}
/** A stable pseudo-random size per ID, without runtime randomness or SSR differences. */
export function dotScale(id: string) { let hash = 2166136261; for (const c of id) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619); return .75 + (hash >>> 0) / 4294967295 * .6; }
export function dotPosition(cell: Cell, index: number, time: number, scale = 1, burst = 1): Point {
  const radius = (.56 * 2.8 * cell.dotRadius * Math.sqrt(index + .5) + (cell.group === 0 ? 17 : 12)) * scale * burst;
  const angle = index * 2.39996 + time * .045 * (cell.group % 2 ? -1 : 1);
  return { x: cell.x + Math.cos(angle) * radius, y: cell.y + Math.sin(angle) * radius };
}
export function membraneRadius(radius: number, theta: number, time: number, group: number) {
  return radius * (1 + .045 * Math.sin(3 * theta + .7 * time + group) + .03 * Math.sin(5 * theta - .5 * time + 2.3 * group) + .02 * Math.sin(2 * theta + .3 * time));
}
export function cellPulse(time: number, group: number, reduced = false) {
  if (reduced) return 0;
  const elapsed = time % 3.2 - (group === 0 ? 0 : .55);
  return elapsed >= 0 && elapsed <= .5 ? Math.sin(elapsed / .5 * Math.PI) : 0;
}
export const easeBurst = (value: number) => 1 - (1 - Math.max(0, Math.min(1, value))) ** 3;
export function relationSentence(relation: CellRelation, selected: string, names: Map<string, string>) {
  const outgoing = selected === relation.from_org_id;
  const name = names.get(outgoing ? relation.to_org_id : relation.from_org_id) ?? '';
  const verbs: Record<string, [string, string]> = { invested_in: ['Invested in', 'Backed by'], spun_out_of: ['Spun out of', 'Spinout:'], acquired: ['Acquired', 'Acquired by'], partner_of: ['Partner of', 'Partner of'] };
  return `${verbs[relation.relation]?.[outgoing ? 0 : 1] ?? 'Connected to'} ${name}`;
}
export interface Rect { x: number; y: number; width: number; height: number }
export const rectOverlap = (a: Rect, b: Rect, gap = 3) => a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
export function rectCellOverlap(rect: Rect, cell: Cell) {
  const x = Math.max(rect.x, Math.min(cell.x, rect.x + rect.width)), y = Math.max(rect.y, Math.min(cell.y, rect.y + rect.height));
  return Math.hypot(x - cell.x, y - cell.y) < cell.radius * 1.2 + 7;
}
export interface CellLabel extends Rect { group: number; lines: string[]; align: CanvasTextAlign }
/** Find an outward label position clear of membranes and already measured labels. */
export function layoutLabels(cells: Cell[], width: number, height: number, measure: (text: string) => number): CellLabel[] {
  const phone = width < 600, labels: CellLabel[] = [];
  for (const cell of cells) {
    const name = CELL_GROUPS[cell.group]?.name.toUpperCase() ?? '';
    const maxWidth = phone ? 88 : 165;
    const words = name.split(' '), lines: string[] = []; let line = '';
    for (const word of words) { if (line && (measure(`${line} ${word}`) > maxWidth || (phone && line.endsWith(' AND')))) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word; }
    if (line) lines.push(line);
    const w = Math.max(...lines.map(measure)), h = lines.length * (phone ? 11 : 13);
    const outward = cell.group === 0 ? -Math.PI / 2 : Math.atan2(cell.y - (height / 2 + 18), cell.x - width / 2);
    const candidates: { rect: Rect; score: number }[] = [];
    for (let ring = 0; ring < 12; ring++) for (let step = 0; step < 24; step++) {
      const angle = outward + (step % 2 ? 1 : -1) * Math.ceil(step / 2) * Math.PI / 12;
      const distance = cell.radius * 1.2 + 13 + ring * 7;
      const px = cell.x + Math.cos(angle) * distance, py = cell.y + Math.sin(angle) * distance;
      const x = Math.max(6, Math.min(width - w - 6, px + (Math.cos(angle) > .25 ? 0 : Math.cos(angle) < -.25 ? -w : -w / 2)));
      const y = Math.max(6, Math.min(height - 45 - h, py + (Math.sin(angle) > .25 ? 0 : Math.sin(angle) < -.25 ? -h : -h / 2)));
      const rect = { x, y, width: w, height: h };
      if (!cells.some(c => rectCellOverlap(rect, c)) && !labels.some(l => rectOverlap(rect, l, 5))) candidates.push({ rect, score: ring * 8 + step * 2 });
    }
    candidates.sort((a, b) => a.score - b.score);
    const best = candidates[0]?.rect;
    if (best) labels.push({ ...best, group: cell.group, lines, align: cell.x < width / 2 ? 'right' : 'left' });
  }
  return labels;
}