import { CELL_GROUPS, CELL_LINKS, cellGroup, cellIntro, cellPulse, dotPosition, dotScale, linkIntro, relationIntro, layoutCells, layoutLabels, membraneRadius, rectOverlap, type Cell, type CellData, type CellLabel, type Point, type Rect } from '@/lib/living-cells';

export type CellSelection = { group: number; orgId?: string } | null;
interface Curve { from: Cell; to: Cell; start: Point; end: Point; control: Point; sentence: string; index: number }
export interface CellScene {
  draw: (time: number, opening: number, selected: CellSelection) => void;
  hit: (x: number, y: number) => CellSelection;
  cells: Cell[];
  labels: CellLabel[];
}
const curvePoint = (c: Curve, t: number): Point => ({ x: (1 - t) ** 2 * c.start.x + 2 * (1 - t) * t * c.control.x + t * t * c.end.x, y: (1 - t) ** 2 * c.start.y + 2 * (1 - t) * t * c.control.y + t * t * c.end.y });

export function createCellScene(canvas: HTMLCanvasElement, data: CellData, reduced: boolean): CellScene | null {
  const ctx = canvas.getContext('2d'); if (!ctx) return null;
  const w = canvas.clientWidth, h = canvas.clientHeight, phone = w < 600;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const style = getComputedStyle(canvas);
  const token = (name: string) => style.getPropertyValue(name).trim();
  const colours: Record<string, string> = { ink: token('--ink'), money: token('--cell-money'), science: token('--cell-science'), support: token('--cell-support') };
  const background = token('--home-surface') || token('--background'), white = token('--cell-white');
  const font = token('--font-body'), mono = token('--cell-mono');
  const organisationGroups = new Map(data.organisations.map(o => [o.id, cellGroup(o.type)]));
  const fontSize = phone ? 9 : 11;
  ctx.font = `${fontSize}px ${font}`;
  const cells = layoutCells(data, w, h);
  const labels = layoutLabels(cells, w, h, text => ctx.measureText(text).width);
  let positions = new Map<string, Point>(), scales = new Map<number, number>();
  const colour = (cell: Cell) => colours[CELL_GROUPS[cell.group]?.tone ?? 'ink'] ?? colours['ink'] ?? '';
  const dot = (p: Point, r: number, fill: string, alpha: number) => { ctx.globalAlpha = alpha; ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); };
  const membrane = (cell: Cell, radius: number, time: number) => {
    ctx.beginPath();
    for (let n = 0; n < 72; n++) {
      const angle = n / 72 * Math.PI * 2, r = reduced ? radius : membraneRadius(radius, angle, time, cell.group);
      const x = cell.x + Math.cos(angle) * r, y = cell.y + Math.sin(angle) * r;
      if (n === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };
  function curves(): Curve[] {
    return CELL_LINKS.flatMap((link, index) => {
      const from = cells.find(c => c.group === link.from), to = cells.find(c => c.group === link.to); if (!from || !to) return [];
      const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
      const start = { x: from.x + dx / length * from.radius * (scales.get(from.group) ?? 1), y: from.y + dy / length * from.radius * (scales.get(from.group) ?? 1) };
      const end = { x: to.x - dx / length * to.radius * (scales.get(to.group) ?? 1), y: to.y - dy / length * to.radius * (scales.get(to.group) ?? 1) };
      const bend = Math.min(48, length * .13) * (index % 2 ? 1 : -1);
      return [{ from, to, start, end, control: { x: (start.x + end.x) / 2 - dy / length * bend, y: (start.y + end.y) / 2 + dx / length * bend }, sentence: link.sentence, index }];
    });
  }
  function draw(time: number, opening: number, selected: CellSelection) {
    if (!ctx) return;
    ctx.globalAlpha = 1; ctx.clearRect(0, 0, w, h);
    positions = new Map(); scales = new Map();
    // Opening is scroll progress 0..1; motion and pulses run only once fully built.
    const live = !reduced && opening >= 1, built = reduced ? 1 : opening;
    const order = (cell: Cell) => cell.group === 0 ? 0 : cells.filter(c => c.group !== 0).indexOf(cell) + 1;
    const intro = (cell: Cell) => cellIntro(built, order(cell), cells.length);
    const orgRelated = new Set<string>(selected?.orgId ? [selected.orgId] : []);
    if (selected?.orgId) data.relations.forEach(r => { if (r.from_org_id === selected.orgId) orgRelated.add(r.to_org_id); if (r.to_org_id === selected.orgId) orgRelated.add(r.from_org_id); });
    const groupRelated = new Set<number>(selected ? [selected.group] : []);
    if (selected && !selected.orgId) CELL_LINKS.forEach(l => { if (l.from === selected.group) groupRelated.add(l.to); if (l.to === selected.group) groupRelated.add(l.from); });
    for (const cell of cells) {
      const scale = (selected?.group === cell.group && !selected.orgId ? 1.1 : 1) * (1 + .06 * (live ? cellPulse(time, cell.group) : 0));
      scales.set(cell.group, scale);
      cell.orgs.forEach((o, i) => positions.set(o.id, dotPosition(cell, i, live ? time : 0, scale, intro(cell))));
    }
    const links = curves();
    const linkOrder = [...links].sort((a, b) => Math.max(order(a.from), order(a.to)) - Math.max(order(b.from), order(b.to)) || a.index - b.index);
    for (const link of links) {
      const highlighted = Boolean(selected && !selected.orgId && (link.from.group === selected.group || link.to.group === selected.group));
      const dim = selected ? selected.orgId ? .16 : highlighted ? 1 : .16 : 1;
      const progress = linkIntro(built, linkOrder.indexOf(link), links.length);
      ctx.strokeStyle = highlighted ? colours['money'] ?? '' : colours['ink'] ?? ''; ctx.globalAlpha = (highlighted ? .55 : .15) * dim; ctx.lineWidth = .9;
      ctx.beginPath(); ctx.moveTo(link.start.x, link.start.y);
      const end = curvePoint(link, progress), control = { x: link.start.x + (link.control.x - link.start.x) * progress, y: link.start.y + (link.control.y - link.start.y) * progress };
      ctx.quadraticCurveTo(control.x, control.y, end.x, end.y); ctx.stroke();
      if (live && progress === 1) {
        dot(curvePoint(link, (time / 13 + link.index * .137) % 1), 1.7, colours['money'] ?? '', .3 * dim);
        const pulse = time % 3.2;
        const startupLink = link.from.group === 0 || link.to.group === 0;
        const p = startupLink ? pulse / .55 : (pulse - .55) / .55;
        if (p >= 0 && p <= 1) dot(curvePoint(link, startupLink && link.to.group === 0 ? 1 - p : p), 3, colours['money'] ?? '', dim);
      }
    }
    const flash = live ? Math.max(cellPulse(time, 0), cellPulse(time, 1)) : 0;
    const relAlpha = relationIntro(built);
    for (const r of data.relations) {
      const a = positions.get(r.from_org_id), b = positions.get(r.to_org_id); if (!a || !b) continue;
      const related = selected?.orgId && (r.from_org_id === selected.orgId || r.to_org_id === selected.orgId);
      const activeGroup = selected && !selected.orgId && (organisationGroups.get(r.from_org_id) === selected.group || organisationGroups.get(r.to_org_id) === selected.group);
      const dim = selected ? selected.orgId ? related ? 1 : .16 : activeGroup ? 1 : .16 : 1;
      ctx.globalAlpha = (related ? .65 : .045 + .135 * flash) * dim * relAlpha; ctx.strokeStyle = colours['ink'] ?? ''; ctx.lineWidth = .6;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (const cell of cells) {
      const shown = intro(cell);
      const dim = selected ? selected.orgId ? .16 : groupRelated.has(cell.group) ? 1 : .16 : 1;
      const radius = cell.radius * (scales.get(cell.group) ?? 1) * shown;
      ctx.fillStyle = colour(cell); ctx.strokeStyle = colour(cell);
      membrane(cell, radius, time); ctx.globalAlpha = (cell.group === 0 ? .06 : .09) * dim * shown; ctx.fill(); ctx.lineWidth = 1; ctx.globalAlpha = .45 * dim * shown; ctx.stroke();
      membrane(cell, radius + 5 * shown, time * .87 + .5); ctx.lineWidth = .6; ctx.globalAlpha = .14 * dim * shown; ctx.stroke();
      for (const o of cell.orgs) {
        const p = positions.get(o.id); if (!p) continue;
        const sharp = selected?.orgId ? orgRelated.has(o.id) : !selected || groupRelated.has(cell.group);
        dot(p, cell.dotRadius * dotScale(o.id) * shown, colour(cell), (sharp ? .85 : .85 * .16) * shown);
        if (selected?.orgId === o.id) { ctx.globalAlpha = 1; ctx.strokeStyle = colours['money'] ?? ''; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.stroke(); }
      }
      const nucleus = (phone ? cell.group === 0 ? 16 : 10 : cell.group === 0 ? 21 : 13) * (1 + .14 * cellPulse(time, cell.group, reduced)) * shown;
      membrane(cell, nucleus, time); ctx.fillStyle = colour(cell); ctx.globalAlpha = dim * shown; ctx.fill();
      ctx.fillStyle = white; ctx.font = `${phone ? 9 : 11}px ${mono}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(cell.orgs.length), cell.x, cell.y + .5);
    }
    // Opaque page-colour label footprints keep even crossing links out of the text.
    ctx.font = `${fontSize}px ${font}`; ctx.textBaseline = 'top';
    for (const label of labels) {
      const alpha = selected ? selected.orgId ? .16 : groupRelated.has(label.group) ? 1 : .16 : 1;
      ctx.globalAlpha = 1; ctx.fillStyle = background; ctx.fillRect(label.x - 3, label.y - 2, label.width + 6, label.height + 4);
      ctx.globalAlpha = alpha * (() => { const c = cells.find(x => x.group === label.group); return c ? intro(c) : 1; })(); ctx.fillStyle = colours['ink'] ?? ''; ctx.textAlign = label.align;
      label.lines.forEach((line, i) => ctx.fillText(line, label.x + (label.align === 'right' ? label.width : 0), label.y + i * (phone ? 11 : 13)));
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `${phone ? 8 : 10}px ${font}`;
    let x = 8;
    for (const [label, tone] of [['MONEY', 'money'], ['SCIENCE AND CARE', 'science'], ['SUPPORT', 'support']]) {
      dot({ x: x + 3, y: h - 18 }, 2.5, colours[tone ?? 'ink'] ?? '', 1);
      ctx.globalAlpha = .75; ctx.fillStyle = colours['ink'] ?? ''; ctx.fillText(label ?? '', x + 12, h - 18); x += 12 + ctx.measureText(label ?? '').width + (phone ? 13 : 22);
      if (tone !== 'support') { ctx.fillText('·', x - 9, h - 18); }
    }
    ctx.globalAlpha = 1;
  }
  return { cells, labels, draw, hit: (x, y) => {
    // Nuclei belong to groups; tiny dot targets never steal the group-count tap.
    for (const cell of cells) {
      const nucleus = phone ? cell.group === 0 ? 16 : 10 : cell.group === 0 ? 21 : 13;
      if (Math.hypot(x - cell.x, y - cell.y) <= nucleus) return { group: cell.group };
    }
    let closest: { id: string; group: number; distance: number } | undefined;
    for (const cell of cells) for (const o of cell.orgs) {
      const p = positions.get(o.id); if (!p) continue; const distance = Math.hypot(x - p.x, y - p.y);
      if (distance <= 8 && (!closest || distance < closest.distance)) closest = { id: o.id, group: cell.group, distance };
    }
    if (closest) return { group: closest.group, orgId: closest.id };
    for (const cell of cells) if (Math.hypot(x - cell.x, y - cell.y) <= cell.radius * (scales.get(cell.group) ?? 1) + 8) return { group: cell.group };
    for (const l of labels) if (x >= l.x - 4 && x <= l.x + l.width + 4 && y >= l.y - 4 && y <= l.y + l.height + 4) return { group: l.group };
    return null;
  } };
}