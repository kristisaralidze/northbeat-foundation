import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { heartbeatQuery } from '@/lib/heartbeat.query';
import { buildBeats, clamp01, heightAt, HORIZON, localKey, restingBeats, smoothstep, beatHeight, buildStops, dayAtProgress, sectionHeightVh, heightScale, REST_HEIGHT, mergeBeats, beatTitle, type Beat, type HeartbeatItem } from '@/lib/heartbeat';
import { chosenLogoSrc } from '@/components/site/OrganisationLogo';
import { publicTitle } from '@/lib/profiles';
import { brandfetchLogoUrl } from '@/lib/organisation-logo';

const FLIGHT_END = 0.68, UNROLL_END = 0.9;
const OPENING_KEY = 'northbeat:heartbeat-opening';
type Hit = { x: number; y: number; r: number; beat: Beat };
type Card = { beat: Beat; x: number; y: number; pinned: boolean };

function todayKey() { return localKey(new Date().toISOString()); }
function dateFor(day: number, long = false) {
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + Math.floor(day));
  return new Intl.DateTimeFormat('en-GB', long ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short' }).format(d);
}
/** One logo per item: the organiser's official logo, else the Brandfetch icon for the event's own website. */
function itemLogo(item: HeartbeatItem) {
  for (const o of item.orgs) { const src = chosenLogoSrc(o.logo_choice, o.logo_url, o.website); if (src) return src; }
  return brandfetchLogoUrl(item.website ?? null, 'icon');
}
/** "17 Nov" or "17–18 Nov" for a merged beat. */
function beatDate(b: Beat, long = false) {
  const end = (b as Beat & { endDay?: number }).endDay ?? b.day;
  if (end === b.day) return dateFor(b.day, long);
  const a = dateFor(b.day, long), z = dateFor(end, long);
  const [ad, ...am] = a.split(' '), [zd, ...zm] = z.split(' ');
  return am.join(' ') === zm.join(' ') ? `${ad}–${zd} ${zm.join(' ')}` : `${a}–${z}`;
}
function itemPath(item: HeartbeatItem) { return item.kind === 'event' ? `/event/${item.slug}` : `/opportunity/${item.slug}`; }

export function HeartbeatHero() {
  const { data } = useSuspenseQuery(heartbeatQuery);
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const finale = useRef<HTMLDivElement>(null);
  const passing = useRef<HTMLParagraphElement>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [reduced, setReduced] = useState(false);
  const [card, setCard] = useState<Card | null>(null);
  const [next, setNext] = useState<{ beat: Beat; key: string } | null>(null);
  const [nextLogoFailed, setNextLogoFailed] = useState(false);
  const navigate = useNavigate();
  const hits = useRef<Hit[]>([]);
  const cardRef = useRef<Card | null>(null);
  cardRef.current = card;

  useEffect(() => {
    setBeats(mergeBeats(buildBeats(data.items, todayKey())).map(b => ({ ...b, amp: beatHeight(b.items) })));
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [data]);
  const rest = useMemo(() => restingBeats(beats).map(b => ({ ...b, amp: REST_HEIGHT })), [beats]);
  const allBeats = useMemo(() => [...beats, ...rest], [beats, rest]);

  useEffect(() => {
    const host = section.current, el = canvas.current;
    if (!host || !el || !beats.length && !rest.length) return;
    const ctx = el.getContext('2d'); if (!ctx) return;
    const css = getComputedStyle(host);
    const probe = document.createElement('span'); host.append(probe);
    const tiny = document.createElement('canvas').getContext('2d');
    const colour = (token: string, fallback: string) => {
      probe.style.color = `var(${token})`; const value = getComputedStyle(probe).color || fallback;
      if (!tiny) return value; tiny.clearRect(0, 0, 1, 1); tiny.fillStyle = value; tiny.fillRect(0, 0, 1, 1);
      const p = tiny.getImageData(0, 0, 1, 1).data; return `rgb(${p[0]},${p[1]},${p[2]})`;
    };
    const INK = colour('--ink', '#222'), SOFT = colour('--ink-soft', '#666'), ACCENT = colour('--berry', '#933'), LINE = colour('--hairline', '#ddd'), TILE = colour('--card', '#fff');
    probe.remove();
    const display = css.getPropertyValue('--font-display').trim() || 'serif';
    const body = css.getPropertyValue('--font-body').trim() || 'sans-serif';

    const images = new Map<string, HTMLImageElement | null>();
    const image = (src: string) => {
      if (images.has(src)) { const img = images.get(src); return img && img.complete && img.naturalWidth ? img : null; }
      const img = new Image(); img.decoding = 'async'; img.onerror = () => images.set(src, null); img.src = src; images.set(src, img); return null;
    };
    const beatLogos = new Map(beats.map(b => [b, b.items.map(itemLogo)]));

    let W = 0, H = 0, dpr = 1, phone = false;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = el.clientWidth; H = el.clientHeight; phone = W < 640;
      el.width = Math.round(W * dpr); el.height = Math.round(H * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);

    const lastBeat = beats.length ? (beats[beats.length - 1]?.day ?? 0) : 0;
    const flightEnd = Math.max(6, lastBeat - 4);
    let idle = -0.6, cur = reduced ? 0 : -0.6, prevCur = cur;
    let mx = 0.5, my = 0.5, smx = 0.5, smy = 0.5;
    let pulseUntil = 0, pulseScale = 1, pulseLen = 1;
    const maxAmp = Math.max(REST_HEIGHT, mergeBeats, beatTitle, ...beats.map(b => b.amp));
    let lastNext = '';
    let opening = false, openStart = 0;
    if (!reduced) {
      try { if (!sessionStorage.getItem(OPENING_KEY)) { opening = true; sessionStorage.setItem(OPENING_KEY, '1'); } } catch { /* storage blocked */ }
    }
    const skipOpening = () => { opening = false; openStart = -1e9; };
    const onScroll = () => { if (opening && window.scrollY > 4) skipOpening(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    const onMove = (e: PointerEvent) => { mx = e.clientX / window.innerWidth; my = e.clientY / window.innerHeight; };
    window.addEventListener('pointermove', onMove, { passive: true });

    const progress = () => {
      if (reduced) return 1;
      const r = host.getBoundingClientRect(); const span = r.height - window.innerHeight;
      return span > 0 ? clamp01(-r.top / span) : 0;
    };

    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; });
    io.observe(host);
    let raf = 0, last = performance.now(), started = last;
    let lastMargin = 0;

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      if (!visible) return;
      const p = progress();
      if (opening && !openStart) openStart = t;
      const openT = opening ? (t - openStart) / 1000 : 99;
      if (opening && openT > 3.4) opening = false;

      if (p < 0.01 && !reduced) idle = Math.min(2.4, idle + 0.3 * dt);
      const target = reduced ? 0 : dayAtProgress(Math.min(1, p / FLIGHT_END), buildStops(beats, idle, flightEnd));
      prevCur = cur; cur += (target - cur) * Math.min(1, dt * 3.5);
      smx += (mx - smx) * Math.min(1, dt * 3); smy += (my - smy) * Math.min(1, dt * 3);

      // Reserve the bottom for the Next up card (its height + 24px) and fit the nearest line point above it.
      const nextEl = host.querySelector<HTMLElement>('.nb-heartbeat-next');
      const reserve = (nextEl?.offsetHeight || (phone ? 76 : 76)) + 24 + (phone ? 16 : 24);
      const usable = H - reserve;
      const HY = (phone ? 0.36 : 0.34) * H;
      const F = Math.min(phone ? Math.min(0.75 * H, 1.35 * W) : Math.min(0.85 * H, 0.9 * W), (usable - HY - 8) * 3.6 / 2.95);
      const CX = (phone ? 0.5 : 0.38) * W;
      const camX = phone ? -0.6 : -1.8 + (smx - 0.5) * 2;
      const k = heightScale(maxAmp, usable - 96 - (phone ? 70 : 80), F, 3.6, 1);
      const rise = openT < 1 ? 0 : clamp01((openT - 1) / 2.4);
      const camH = (opening ? 1 + 1.6 * smoothstep(rise) : 2.6) + (0.5 - smy) * 0.7;
      const m = reduced ? 1 : smoothstep((p - FLIGHT_END) / (UNROLL_END - FLIGHT_END));
      const pad = phone ? 20 : 56;
      const flatX = (d: number) => pad + (d / HORIZON) * (W - 2 * pad);
      const flatY = (h: number) => (phone ? 0.5 * H - h * 8 : 0.56 * H - h * 13);
      const proj = (d: number, y: number) => {
        const z = 3.6 + (d - cur) * 3.0; if (z < 0.4) return null;
        return { x: CX + (0 - camX) * F / z, y: HY + (camH - y * k) * F / z, z };
      };
      const mixFor = (d: number) => smoothstep(m * 1.6 - clamp01((d - cur) / 12) * 0.6);

      // Beat crossings.
      if (!reduced && m === 0 && cur > prevCur) {
        for (const b of beats) if (b.day > prevCur && b.day <= cur) {
          const big = b.items.length >= 3; pulseScale = big ? 1.024 : 1.011; pulseLen = big ? 240 : 140; pulseUntil = t + pulseLen;
        }
      }
      const ahead = beats.find(b => b.day > cur + 0.05) ?? null;
      const nk = m > 0.05 || !ahead ? '' : String(ahead.day);
      if (nk !== lastNext) { lastNext = nk; setNext(ahead && nk ? { beat: ahead, key: nk } : null); }
      const nearestBeat = beats.find(b => b.day >= cur - 0.3) ?? null;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (m < 1) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, usable + (H - usable) * smoothstep(m)); ctx.clip(); }
      if (t < pulseUntil) { const s = pulseScale; ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      // Opening: flat line with one large beat.
      if (opening && openT < 1.9) {
        const draw = clamp01(openT / 1);
        ctx.globalAlpha = openT < 1 ? 1 : 1 - clamp01((openT - 1) / 0.9);
        ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath();
        for (let x = 0; x <= W * draw; x += 2) {
          const u = (x - W / 2) / (W * 0.12);
          const y = H / 2 - (Math.abs(u) < 1 ? (0.42 * H) * pqrstLocal(u) : 0);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
      const sceneAlpha = opening ? clamp01((openT - 1) / 0.9) : 1;
      ctx.globalAlpha = sceneAlpha;

      // Line.
      const from = m > 0 ? 0 : cur, to = m > 0 ? HORIZON : cur + 12, step = m > 0 ? 0.02 : 0.014;
      type Pt = { x: number; y: number; a: number; w: number };
      // Behind-camera days and days ahead are separate lines, never joined, so no segment can jump across the screen.
      const segs: Pt[][] = []; let segKey = '';
      const push = (q: Pt, key: string) => { if (key !== segKey || !segs.length) { segs.push([]); segKey = key; } segs[segs.length - 1]!.push(q); };
      const yMax = m > 0 ? H - 2 : H * 1.5;
      const reflect: { x: number; y: number }[] = [];
      for (let d = Math.max(from, -2); d <= to; d += step) {
        const h = heightAt(d, allBeats);
        const fp = { x: flatX(d), y: flatY(h) };
        const pp = m < 1 ? proj(d, h) : null;
        const mi = mixFor(d);
        if (pp && m < 1) {
          const fade = Math.max(0, 1 - (pp.z - 3.6) / 36) ** 1.25;
          const cx = Math.max(-W * 0.5, Math.min(W * 1.5, pp.x)), cy = Math.max(-H * 0.5, Math.min(yMax, pp.y));
          const w3 = Math.max(1, Math.min(3.2, F / pp.z * 0.018));
          push({ x: cx + (fp.x - cx) * mi, y: Math.min(yMax, cy + (fp.y - cy) * mi), a: (0.12 + 0.88 * fade) * (1 - mi) + mi, w: w3 + (1.5 - w3) * mi }, d < cur ? 'behind-p' : 'ahead');
          if (m === 0) { const rp = proj(d, h * -0.5); if (rp) reflect.push({ x: rp.x, y: rp.y }); }
        } else if (m > 0) push({ ...fp, a: mi, w: 1.5 }, d < cur ? 'behind' : 'ahead-flat');
      }
      ctx.strokeStyle = INK;
      if (reflect.length) {
        ctx.globalAlpha = sceneAlpha * 0.09; ctx.lineWidth = 1.2; ctx.beginPath();
        reflect.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
      }
      for (const pts of segs) for (let i = 0; i < pts.length - 1; i += 10) {
        const chunk = pts.slice(i, i + 11); const mid = chunk[Math.floor(chunk.length / 2)];
        if (!mid || mid.a <= 0.01) continue;
        ctx.globalAlpha = sceneAlpha * mid.a; ctx.lineWidth = mid.w; ctx.beginPath();
        chunk.forEach((q, j) => j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
      }

      // Sweep dot once flat.
      let sweepX = -1e9;
      if (m >= 1) {
        const s = ((t - started) % 7000) / 7000; const d = s * HORIZON;
        sweepX = flatX(d);
        ctx.globalAlpha = 1; ctx.fillStyle = ACCENT; ctx.beginPath(); ctx.arc(sweepX, flatY(heightAt(d, allBeats)), 3.5, 0, Math.PI * 2); ctx.fill();
      }

      // Logos and labels.
      type Box = { x: number; y: number; w: number; h: number };
      const overlaps = (a: Box, list: Box[]) => list.some(l => a.x < l.x + l.w && a.x + a.w > l.x && a.y < l.y + l.h && a.y + a.h > l.y);
      const nextHits: Hit[] = []; const logoBoxes: Box[] = []; const labels: Box[] = []; const flatDates: number[] = [];
      const visibleBeats = beats.filter(b => m > 0 || (b.day >= cur && b.day <= cur + 12)).slice(0, 40);
      const ordered = [...visibleBeats].sort((a, b) => a.day - b.day);
      const placed: { b: Beat; peak: { x: number; y: number }; r: number; cy: number; alpha: number; mi: number; pp: ReturnType<typeof proj>; fp: { x: number; y: number } }[] = [];
      let drawnLogos = 0;
      for (const b of ordered) {
        const h = heightAt(b.day, allBeats);
        const pp = m < 1 ? proj(b.day, h) : null;
        const fp = { x: flatX(b.day), y: flatY(h) };
        const mi = m > 0 ? mixFor(b.day) : 0;
        if (!pp && mi <= 0) continue;
        const minR = b === nearestBeat ? (phone ? 22 : 28) : 6;
        const r3 = pp ? Math.max(minR, Math.min(phone ? 26 : 32, F / pp.z * 0.36)) : 0;
        let rf = phone ? 8 : 11;
        if (Math.abs(fp.x - sweepX) < 18) rf *= 1.15;
        const peak = pp && mi < 1 ? { x: pp.x + (fp.x - pp.x) * mi, y: pp.y + (fp.y - pp.y) * mi } : fp;
        const r = pp && mi < 1 ? r3 + (rf - r3) * mi : rf;
        const fade = pp ? Math.max(0, 1 - (pp.z - 3.6) / 36) ** 1.25 : 1;
        const alpha = sceneAlpha * (pp ? (0.25 + 0.75 * fade) * (1 - mi) + mi : mi);
        if (peak.x < -60 || peak.x > W + 60 || peak.y < -60 || peak.y > H + 60) continue;
        const cy = peak.y - r - Math.max(10, r * 1.2);
        placed.push({ b, peak, r, cy, alpha, mi, pp, fp });
        // Only logos that actually loaded get a circle; failed or missing logos leave just the spike.
        const srcs = beatLogos.get(b) ?? [];
        const ready: HTMLImageElement[] = [];
        for (const src of srcs) { if (ready.length >= 3) break; const img = src && drawnLogos < 60 ? image(src) : null; if (img) ready.push(img); }
        const topLimit = (passing.current ? passing.current.offsetTop + passing.current.offsetHeight : 100) + 16;
        if (ready.length && cy - r < topLimit && m < 0.6) ready.length = 0;
        (placed[placed.length - 1] as { logos?: boolean }).logos = ready.length > 0;
        if (!ready.length) { nextHits.push({ x: peak.x, y: peak.y, r: 14, beat: b }); continue; }
        const extra = b.items.length - ready.length;
        const total = ready.length + (extra > 0 ? 1 : 0);
        const gap = r * 2 + 4;
        ctx.globalAlpha = alpha; ctx.strokeStyle = LINE; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(peak.x, peak.y - 2); ctx.lineTo(peak.x, cy + r); ctx.stroke();
        for (let k = 0; k < total; k++) {
          const x = peak.x + (k - (total - 1) / 2) * gap;
          const img = ready[k];
          if (img) {
            drawnLogos++; circle(ctx, x, cy, r, TILE, LINE);
            ctx.save(); ctx.beginPath(); ctx.arc(x, cy, r * 0.78, 0, Math.PI * 2); ctx.clip();
            const sz = r * 1.4; ctx.drawImage(img, x - sz / 2, cy - sz / 2, sz, sz); ctx.restore();
          } else {
            circle(ctx, x, cy, r, TILE, LINE); ctx.fillStyle = INK; ctx.font = `${Math.max(9, r * 0.7)}px ${body}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`+${extra}`, x, cy);
          }
        }
        const w = total * gap; logoBoxes.push({ x: peak.x - w / 2, y: cy - r - 2, w, h: r * 2 + 4 });
        nextHits.push({ x: peak.x, y: cy, r: Math.max(w / 2, 14), beat: b });
      }
      // Labels: flat dates under the line; in flight, date and title for the two nearest beats only.
      ctx.textAlign = 'center';
      if (m >= 0.6) {
        const dateY = flatY(0) + (phone ? 26 : 34);
        ctx.textBaseline = 'top';
        for (const q of placed) {
          if (flatDates.some(x => Math.abs(x - q.fp.x) < 40)) continue;
          flatDates.push(q.fp.x); ctx.globalAlpha = sceneAlpha * clamp01((m - 0.6) / 0.4); ctx.fillStyle = SOFT; ctx.font = `11px ${body}`;
          ctx.fillText(dateFor(q.b.day), q.fp.x, dateY);
        }
      } else {
        ctx.textBaseline = 'alphabetic';
        const nearest = placed.filter(q => q.b === nearestBeat && q.pp && q.mi < 0.3);
        for (const q of nearest) {
          const pp = q.pp!;
          const titleSize = phone ? 15 : Math.max(16, Math.min(22, F / pp.z * 0.22));
          // Centred on its own spike, above its own logos (or the spike tip), at most 80% of the screen wide.
          const lx = q.peak.x;
          const maxW = Math.min(W * 0.8, 2 * Math.min(lx, W - lx) - 16);
          if (maxW < 60) continue;
          ctx.font = `${titleSize}px ${display}`;
          const title = fitText(ctx, beatTitle(q.b.items.map(i => publicTitle(i.title))), maxW);
          const tw = ctx.measureText(title).width;
          const anchor = (q as { logos?: boolean }).logos ? q.cy - q.r - 8 : q.peak.y - 8;
          const box = { x: lx - tw / 2, y: anchor - titleSize - 22, w: tw, h: titleSize + 22 };
          const topLimit = (passing.current ? passing.current.offsetTop + passing.current.offsetHeight : 100) + 16;
          if (box.y < topLimit || overlaps(box, labels)) continue;
          labels.push(box); ctx.globalAlpha = q.alpha * (1 - q.mi / 0.3);
          ctx.fillStyle = SOFT; ctx.font = `12px ${body}`; ctx.fillText(beatDate(q.b), lx, box.y + 10);
          ctx.fillStyle = INK; ctx.font = `${titleSize}px ${display}`; ctx.fillText(title, lx, box.y + 12 + titleSize);
        }
      }
      ctx.globalAlpha = 1;
      if (m < 1) ctx.restore();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hits.current = nextHits;

      // HTML overlays.
      if (finale.current) { const f = reduced ? 1 : clamp01((p - 0.84) / 0.06); finale.current.style.opacity = String(f); finale.current.style.pointerEvents = f > 0.5 ? 'auto' : 'none'; finale.current.style.top = `${flatY(0) + (phone ? 56 : 68)}px`; }
      if (passing.current) passing.current.style.opacity = String(1 - clamp01(m * 2));
      // Close the gap after the unroll: pull the next section up to 100px below the button.
      if (finale.current && !reduced) {
        const btnBottom = flatY(0) + (phone ? 56 : 68) + finale.current.offsetHeight;
        const heading = document.getElementById('ecosystem-heading'), next = host.nextElementSibling as HTMLElement | null;
        const inset = heading && next ? heading.getBoundingClientRect().top - next.getBoundingClientRect().top : 0;
        const want = -Math.max(0, H - btnBottom + inset - 100);
        if (Math.abs(want - lastMargin) > 1) { lastMargin = want; host.style.marginBottom = `${want}px`; }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener('scroll', onScroll); window.removeEventListener('pointermove', onMove);
    };
  }, [beats, rest, allBeats, reduced]);

  const hitAt = (clientX: number, clientY: number) => {
    const r = canvas.current?.getBoundingClientRect(); if (!r) return null;
    const x = clientX - r.left, y = clientY - r.top;
    return hits.current.find(h => Math.abs(h.x - x) < h.r && Math.abs(h.y - y) < Math.max(h.r, 18) * 1.6) ?? null;
  };
  const onCanvasMove = (e: React.PointerEvent) => {
    if (cardRef.current?.pinned) return;
    const hit = hitAt(e.clientX, e.clientY);
    if (!hit) { if (cardRef.current) setCard(null); return; }
    if (cardRef.current?.beat !== hit.beat) setCard({ beat: hit.beat, x: hit.x, y: hit.y, pinned: false });
    if (canvas.current) canvas.current.style.cursor = 'pointer';
  };
  const onCanvasClick = (e: React.MouseEvent) => {
    const hit = hitAt(e.clientX, e.clientY);
    if (!hit) { setCard(null); return; }
    if (hit.beat.items.length === 1 && hit.beat.items[0]) { void navigate({ to: itemPath(hit.beat.items[0]) as '/' }); return; }
    setCard({ beat: hit.beat, x: hit.x, y: hit.y, pinned: true });
  };
  useEffect(() => setNextLogoFailed(false), [next?.key]);
  const openNext = () => {
    if (!next) return;
    const items = next.beat.items;
    if (items.length === 1 && items[0]) { void navigate({ to: itemPath(items[0]) as '/' }); return; }
    const W = canvas.current?.clientWidth ?? 0, H = canvas.current?.clientHeight ?? 0;
    setCard({ beat: next.beat, x: W / 2, y: H - 120, pinned: true });
  };
  const nextItem = next?.beat.items[0];
  const nextLogo = nextItem ? itemLogo(nextItem) : null;
  const nextDays = next ? Math.floor(next.beat.day) : 0;
  const deadline = next?.beat.items.some(i => i.kind === 'opportunity') ?? false;
  const when = nextDays <= 0 ? 'Today' : nextDays === 1 ? 'Tomorrow' : `In ${nextDays} days`;
  const whenText = deadline ? (nextDays <= 0 ? 'Deadline today' : nextDays === 1 ? 'Deadline tomorrow' : `Deadline in ${nextDays} days`) : when;
  return <section ref={section} className={`nb-heartbeat${reduced ? ' nb-heartbeat-reduced' : ''}`} style={reduced ? undefined : { height: `${sectionHeightVh(beats.length)}vh` }} aria-labelledby="heartbeat-heading">
    <div className="nb-heartbeat-sticky">
      <canvas ref={canvas} className="nb-heartbeat-canvas" aria-hidden="true" onPointerMove={onCanvasMove} onPointerLeave={() => !cardRef.current?.pinned && setCard(null)} onClick={onCanvasClick} />
      <h2 id="heartbeat-heading" className="sr-only">Events and deadlines in the next 35 days</h2>
      <p ref={passing} className="nb-heartbeat-now" aria-hidden="true">Coming up in Nordic health</p>
      {next && nextItem && <button key={next.key} type="button" className="nb-heartbeat-next" onClick={openNext}>
        {nextLogo && !nextLogoFailed
          ? <img src={nextLogo} alt="" width={32} height={32} onError={() => setNextLogoFailed(true)} />
          : nextItem.orgs[0] && <span className="nb-heartbeat-next-org">{nextItem.orgs[0].name}</span>}
        <span className="nb-heartbeat-next-text">
          <span className="nb-heartbeat-next-label">Next up</span>
          <span className="nb-heartbeat-next-title">{beatTitle(next.beat.items.map(i => publicTitle(i.title)))}</span>
          <span className="nb-heartbeat-next-meta">{beatDate(next.beat, true)}, <span className={deadline ? 'nb-heartbeat-next-deadline' : undefined}>{whenText}</span></span>
        </span>
      </button>}
      <div ref={finale} className="nb-heartbeat-finale">
        <Link to="/events" className="nb-btn nb-btn-primary">See all events and deadlines</Link>
      </div>
      {card && <div className="nb-heartbeat-card" style={{ left: card.x, top: card.y }} role={card.pinned ? 'dialog' : 'tooltip'}>
        <p className="nb-heartbeat-card-date">{dateFor(card.beat.day, true)}</p>
        <ul>{card.beat.items.map(item => <li key={item.id}>
          {card.pinned ? <a className="nb-link" href={itemPath(item)}>{publicTitle(item.title)}</a> : <span>{publicTitle(item.title)}</span>}
          {item.city && <span className="nb-heartbeat-card-city">{item.city}</span>}
        </li>)}</ul>
        {card.pinned && <button type="button" className="nb-link" onClick={() => setCard(null)}>Close</button>}
      </div>}
      <ul className="sr-only">{beats.flatMap(b => b.items).map(item => <li key={item.id}><a href={itemPath(item)}>{publicTitle(item.title)}</a></li>)}</ul>
    </div>
  </section>;
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke: string) {
  ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}
function pqrstLocal(u: number) {
  const g = (v: number, m: number, s: number) => Math.exp(-((v - m) ** 2) / (2 * s * s));
  return 0.12 * g(u, -0.55, 0.08) - 0.10 * g(u, -0.12, 0.03) + g(u, 0, 0.035) - 0.28 * g(u, 0.11, 0.035) + 0.22 * g(u, 0.5, 0.12);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}
