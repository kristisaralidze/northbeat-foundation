import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { heartbeatQuery } from '@/lib/heartbeat.query';
import { buildBeats, clamp01, heightAt, HORIZON, localKey, restingBeats, smoothstep, warpedDay, type Beat, type HeartbeatItem } from '@/lib/heartbeat';
import { chosenLogoSrc } from '@/components/site/OrganisationLogo';
import { publicTitle } from '@/lib/profiles';

const FLIGHT_END = 0.68, UNROLL_END = 0.9;
const OPENING_KEY = 'northbeat:heartbeat-opening';
type Hit = { x: number; y: number; r: number; beat: Beat };
type Card = { beat: Beat; x: number; y: number; pinned: boolean };

function todayKey() { return localKey(new Date().toISOString()); }
function dateFor(day: number, long = false) {
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + Math.floor(day));
  return new Intl.DateTimeFormat('en-GB', long ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short' }).format(d);
}
function itemLogos(item: HeartbeatItem) {
  return item.orgs.map(o => chosenLogoSrc(o.logo_choice, o.logo_url, o.website)).filter((s): s is string => Boolean(s));
}
function itemPath(item: HeartbeatItem) { return item.kind === 'event' ? `/event/${item.slug}` : `/opportunity/${item.slug}`; }

export function HeartbeatHero() {
  const { data } = useSuspenseQuery(heartbeatQuery);
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const liveDot = useRef<HTMLSpanElement>(null);
  const headline = useRef<HTMLDivElement>(null);
  const finale = useRef<HTMLDivElement>(null);
  const passing = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [reduced, setReduced] = useState(false);
  const [card, setCard] = useState<Card | null>(null);
  const [now, setNow] = useState({ date: '', ahead: 0 });
  const navigate = useNavigate();
  const hits = useRef<Hit[]>([]);
  const cardRef = useRef<Card | null>(null);
  cardRef.current = card;

  useEffect(() => {
    setBeats(buildBeats(data.items, todayKey()));
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [data]);
  const rest = useMemo(() => restingBeats(beats), [beats]);
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
    const beatLogos = new Map(beats.map(b => [b, b.items.flatMap(itemLogos)]));

    let W = 0, H = 0, dpr = 1, phone = false; let headBox = { x: 0, y: 0, w: 0, h: 0 };
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = el.clientWidth; H = el.clientHeight; phone = W < 640;
      el.width = Math.round(W * dpr); el.height = Math.round(H * dpr);
      const hr = headline.current?.getBoundingClientRect(), cr = el.getBoundingClientRect();
      if (hr) headBox = { x: 0, y: 0, w: hr.right - cr.left + 12, h: hr.bottom - cr.top + 12 };
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);

    const lastBeat = beats.length ? beats[beats.length - 1].day : 0;
    const flightEnd = Math.max(6, lastBeat - 4);
    let idle = -0.6, cur = reduced ? 0 : -0.6, prevCur = cur;
    let mx = 0.5, my = 0.5, smx = 0.5, smy = 0.5;
    let pulseUntil = 0, pulseScale = 1, pulseLen = 1, captionUntil = 0;
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
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(host);
    let raf = 0, last = performance.now(), started = last;
    let lastAhead = -1, lastDate = '';

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      if (!visible) return;
      const p = progress();
      if (opening && !openStart) openStart = t;
      const openT = opening ? (t - openStart) / 1000 : 99;
      if (opening && openT > 3.4) opening = false;

      if (p < 0.01 && !reduced) idle = Math.min(2.4, idle + 0.3 * dt);
      const target = reduced ? 0 : warpedDay(Math.min(1, p / FLIGHT_END), idle, flightEnd, beats);
      prevCur = cur; cur += (target - cur) * Math.min(1, dt * 3.5);
      smx += (mx - smx) * Math.min(1, dt * 3); smy += (my - smy) * Math.min(1, dt * 3);

      const F = phone ? Math.min(0.75 * H, 1.35 * W) : Math.min(0.85 * H, 0.9 * W);
      const CX = (phone ? 0.12 : 0.38) * W, HY = (phone ? 0.46 : 0.42) * H;
      const camX = (phone ? -1.2 : -1.8) + (smx - 0.5) * 2;
      const rise = openT < 1 ? 0 : clamp01((openT - 1) / 2.4);
      const camH = (opening ? 1 + 1.6 * smoothstep(rise) : 2.6) + (0.5 - smy) * 0.7;
      const m = reduced ? 1 : smoothstep((p - FLIGHT_END) / (UNROLL_END - FLIGHT_END));
      const pad = phone ? 20 : 56;
      const flatX = (d: number) => pad + (d / HORIZON) * (W - 2 * pad);
      const flatY = (h: number) => (phone ? 0.5 * H - h * 5.5 : 0.56 * H - h * 9);
      const proj = (d: number, y: number) => {
        const z = 3.6 + (d - cur) * 3.0; if (z < 0.4) return null;
        return { x: CX + (0 - camX) * F / z, y: HY + (camH - y) * F / z, z };
      };
      const mixFor = (d: number) => smoothstep(m * 1.6 - clamp01((d - cur) / 12) * 0.6);

      // Beat crossings.
      if (!reduced && m === 0 && cur > prevCur) {
        for (const b of beats) if (b.day > prevCur && b.day <= cur) {
          const big = b.items.length >= 3; pulseScale = big ? 1.024 : 1.011; pulseLen = big ? 240 : 140; pulseUntil = t + pulseLen;
          liveDot.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(2)' }, { transform: 'scale(1)' }], { duration: 500 });
          if (caption.current) caption.current.textContent = `${dateFor(b.day, true)}, ${publicTitle(b.items[0].title)}${b.items.length > 1 ? ` and ${b.items.length - 1} more` : ''}`;
          captionUntil = t + 2400;
        }
      }
      if (caption.current) caption.current.style.opacity = t < captionUntil && m < 0.2 ? String(Math.min(1, (captionUntil - t) / 400)) : '0';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
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
      const pts: { x: number; y: number; a: number; w: number }[] = [];
      const reflect: { x: number; y: number }[] = [];
      for (let d = Math.max(from, -2); d <= to; d += step) {
        const h = heightAt(d, allBeats);
        const fp = { x: flatX(d), y: flatY(h) };
        const pp = m < 1 ? proj(d, h) : null;
        const mi = mixFor(d);
        if (pp && m < 1) {
          const fade = Math.max(0, 1 - (pp.z - 3.6) / 36) ** 1.25;
          const cx = Math.max(-W * 0.5, Math.min(W * 1.5, pp.x)), cy = Math.max(-H * 0.5, Math.min(H * 1.5, pp.y));
          const w3 = Math.max(1, Math.min(3.2, F / pp.z * 0.018));
          pts.push({ x: cx + (fp.x - cx) * mi, y: cy + (fp.y - cy) * mi, a: (0.12 + 0.88 * fade) * (1 - mi) + mi, w: w3 + (1.5 - w3) * mi });
          if (m === 0) { const rp = proj(d, h * -0.5); if (rp) reflect.push({ x: rp.x, y: rp.y }); }
        } else if (m > 0) pts.push({ ...fp, a: mi, w: 1.5 });
      }
      ctx.strokeStyle = INK;
      if (reflect.length) {
        ctx.globalAlpha = sceneAlpha * 0.09; ctx.lineWidth = 1.2; ctx.beginPath();
        reflect.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
      }
      for (let i = 0; i < pts.length - 1; i += 10) {
        const chunk = pts.slice(i, i + 11); const mid = chunk[Math.floor(chunk.length / 2)];
        if (mid.a <= 0.01) continue;
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
      { const hr = headline.current?.getBoundingClientRect(), cr = el.getBoundingClientRect(); if (hr) headBox = { x: 0, y: 0, w: hr.right - cr.left + 12, h: hr.bottom - cr.top + 12 }; }
      const nextHits: Hit[] = []; const labels: { x: number; y: number; w: number; h: number }[] = []; const flatDates: number[] = [];
      const visibleBeats = beats.filter(b => m > 0 || (b.day >= cur - 0.3 && b.day <= cur + 12)).slice(0, 40);
      const ordered = [...visibleBeats].sort((a, b) => a.day - b.day);
      let drawnLogos = 0;
      for (const b of ordered) {
        const h = heightAt(b.day, allBeats);
        const pp = m < 1 ? proj(b.day, h) : null;
        const fp = { x: flatX(b.day), y: flatY(h) };
        const mi = m > 0 ? mixFor(b.day) : 0;
        if (!pp && mi <= 0) continue;
        let r3 = pp ? Math.max(6, Math.min(28, F / pp.z * 0.36)) : 0;
        let rf = phone ? 8 : 11;
        if (Math.abs(fp.x - sweepX) < 18) rf *= 1.15;
        const peak = pp && mi < 1 ? { x: pp.x + (fp.x - pp.x) * mi, y: pp.y + (fp.y - pp.y) * mi } : fp;
        const r = pp && mi < 1 ? r3 + (rf - r3) * mi : rf;
        const fade = pp ? Math.max(0, 1 - (pp.z - 3.6) / 36) ** 1.25 : 1;
        const alpha = sceneAlpha * (pp ? (0.25 + 0.75 * fade) * (1 - mi) + mi : mi);
        if (peak.x < -60 || peak.x > W + 60 || peak.y < -60 || peak.y > H + 60) continue;
        const logos = beatLogos.get(b) ?? [];
        const count = Math.min(3, Math.max(1, b.items.length)); const extra = b.items.length - count;
        const gap = r * 2.2; const total = count + (extra > 0 ? 1 : 0);
        const cy = peak.y - r - Math.max(10, r * 1.2);
        ctx.globalAlpha = alpha; ctx.strokeStyle = LINE; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(peak.x, peak.y - 2); ctx.lineTo(peak.x, cy + r); ctx.stroke();
        for (let k = 0; k < total; k++) {
          const x = peak.x + (k - (total - 1) / 2) * gap;
          const src = k < count ? logos[k] : undefined;
          const img = src && drawnLogos < 60 ? image(src) : null;
          if (k >= count) {
            circle(ctx, x, cy, r, TILE, LINE); ctx.fillStyle = INK; ctx.font = `${Math.max(9, r * 0.7)}px ${body}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`+${extra}`, x, cy);
          } else if (img) {
            drawnLogos++; circle(ctx, x, cy, r, TILE, LINE);
            ctx.save(); ctx.beginPath(); ctx.arc(x, cy, r * 0.78, 0, Math.PI * 2); ctx.clip();
            const s = r * 1.4; ctx.drawImage(img, x - s / 2, cy - s / 2, s, s); ctx.restore();
          } else {
            ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, cy, Math.max(2.5, r * 0.22), 0, Math.PI * 2); ctx.fill();
          }
        }
        nextHits.push({ x: peak.x, y: cy, r: Math.max(r * total * 1.1, 14), beat: b });
        // Labels.
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        if (m >= 0.6) {
          if (!flatDates.some(x => Math.abs(x - fp.x) < 52)) {
            flatDates.push(fp.x); ctx.globalAlpha = sceneAlpha * clamp01((m - 0.6) / 0.4); ctx.fillStyle = SOFT; ctx.font = `11px ${body}`;
            ctx.fillText(dateFor(b.day), peak.x, cy - r - 6);
          }
        } else if (pp && mi < 0.3 && pp.z < 14 && !phone) {
          const titleSize = Math.max(13, Math.min(22, F / pp.z * 0.22));
          const title = publicTitle(b.items[0].title) + (b.items.length > 1 ? ` +${b.items.length - 1}` : '');
          ctx.font = `${titleSize}px ${display}`; const tw = Math.min(ctx.measureText(title).width, W * 0.5);
          const box = { x: peak.x - tw / 2, y: cy - r - titleSize - 26, w: tw, h: titleSize + 22 };
          if (![headBox, ...labels].some(l => box.x < l.x + l.w && box.x + box.w > l.x && box.y < l.y + l.h && box.y + box.h > l.y)) {
            labels.push(box); ctx.globalAlpha = alpha * (1 - mi / 0.3);
            ctx.fillStyle = SOFT; ctx.font = `12px ${body}`; ctx.fillText(dateFor(b.day), peak.x, box.y + 10);
            ctx.fillStyle = INK; ctx.font = `${titleSize}px ${display}`; ctx.fillText(title, peak.x, box.y + 12 + titleSize, W * 0.5);
          }
        }
      }
      if (m > 0.6) {
        ctx.globalAlpha = sceneAlpha * clamp01((m - 0.6) / 0.4); ctx.fillStyle = SOFT; ctx.font = `12px ${body}`; ctx.textBaseline = 'top';
        const base = flatY(0) + 22; ctx.textAlign = 'left'; ctx.fillText('Today', pad, base); ctx.textAlign = 'right'; ctx.fillText('Next 35 days', W - pad, base);
      }
      ctx.globalAlpha = 1;
      hits.current = nextHits;

      // HTML overlays.
      if (headline.current) headline.current.style.opacity = String(1 - clamp01(m * 1.5));
      if (finale.current) { const f = reduced ? 1 : clamp01((p - 0.84) / 0.06); finale.current.style.opacity = String(f); finale.current.style.pointerEvents = f > 0.5 ? 'auto' : 'none'; }
      if (passing.current) passing.current.style.opacity = String(1 - clamp01(m * 2));
      if (hint.current) { const show = p < 0.02 && !reduced; hint.current.style.opacity = show ? '1' : '0'; hint.current.style.pointerEvents = show ? 'auto' : 'none'; }
      const day = Math.max(0, cur); const date = dateFor(day, true); const ahead = beats.filter(b => b.day >= day).reduce((n, b) => n + b.items.length, 0);
      if (date !== lastDate || ahead !== lastAhead) { lastDate = date; lastAhead = ahead; setNow({ date, ahead }); }
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
    if (hit.beat.items.length === 1) { void navigate({ to: itemPath(hit.beat.items[0]) as '/' }); return; }
    setCard({ beat: hit.beat, x: hit.x, y: hit.y, pinned: true });
  };
  const skip = () => {
    const host = section.current; if (!host) return;
    window.scrollTo({ top: host.offsetTop + host.offsetHeight - window.innerHeight, behavior: 'smooth' });
  };

  return <section ref={section} className={`nb-heartbeat${reduced ? ' nb-heartbeat-reduced' : ''}`} aria-labelledby="heartbeat-heading">
    <div className="nb-heartbeat-sticky">
      <canvas ref={canvas} className="nb-heartbeat-canvas" aria-hidden="true" onPointerMove={onCanvasMove} onPointerLeave={() => !cardRef.current?.pinned && setCard(null)} onClick={onCanvasClick} />
      <div ref={headline} className="nb-heartbeat-head">
        <p className="nb-heartbeat-live"><span ref={liveDot} className="nb-heartbeat-dot" aria-hidden="true" />Live, next 35 days</p>
        <h1 id="heartbeat-heading">Feel the pulse of Nordic health.</h1>
        <p>Every organisation, open call and event in Nordic health innovation. One heartbeat.</p>
      </div>
      <div ref={passing} className="nb-heartbeat-passing" aria-live="off">
        <p>Now passing</p>
        <p className="nb-heartbeat-date">{now.date}</p>
        <p>{now.ahead} {now.ahead === 1 ? 'event or deadline' : 'events and deadlines'} ahead</p>
      </div>
      <div ref={hint} className="nb-heartbeat-hint">
        <p>Scroll to travel through time</p>
        <button type="button" className="nb-link" onClick={skip}>Skip ahead</button>
      </div>
      <p ref={caption} className="nb-heartbeat-caption" aria-hidden="true" />
      <div ref={finale} className="nb-heartbeat-finale">
        <h2>The next 35 days in Nordic health.</h2>
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
