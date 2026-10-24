// Pure-JS link preview renderer (no native code or wasm), so it runs in the server runtime.
import * as PImage from 'pureimage';
import opentype from 'opentype.js';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400&family=Inter+Tight:wght@500';
const W = 1200, H = 630, S = 2; // drawn at 2x then averaged down, so serif hairlines stay whole.
const COLOURS = { paper: '#F7F5F0', ink: '#131825', muted: '#5B6070', plum: '#86264F', hairline: '#DCD8CE', white: '#FFFFFF' };
let fontsReady: Promise<void> | null = null;

async function loadFonts() {
  const css = await (await fetch(FONT_CSS, { headers: { 'User-Agent': 'Mozilla/4.0' } })).text();
  const urls = [...css.matchAll(/url\((https:[^)]+\.ttf)\)/g)].map(m => m[1]!);
  const families = ['Bodoni', 'Body'];
  await Promise.all(urls.slice(0, 2).map(async (url, i) => {
    const buffer = await (await fetch(url)).arrayBuffer();
    const font = PImage.registerFont('', families[i]!);
    (font as unknown as { font: unknown; loaded: boolean }).font = (opentype as unknown as { parse: (b: ArrayBuffer) => unknown }).parse(buffer);
    (font as unknown as { loaded: boolean }).loaded = true;
  }));
}

type Ctx = ReturnType<ReturnType<typeof PImage.make>['getContext']>;
/** Serif hairlines are thinner than the rasteriser's fill, so a few offset fills keep them whole. */
function serif(ctx: Ctx, text: string, x: number, y: number, colour: string) {
  ctx.fillStyle = colour; for (const [dx, dy] of [[0, 0], [0.6, 0], [0, 0.6], [0.6, 0.6]] as const) ctx.fillText(text, x + dx, y + dy);
}

function wrap(ctx: Ctx, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean); const lines: string[] = []; let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { const kept = lines.slice(0, maxLines); let last = kept[maxLines - 1]!; while (ctx.measureText(`${last}...`).width > maxWidth && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' ')); kept[maxLines - 1] = `${last}...`; return kept; }
  return lines;
}

async function decodeLogo(url: string): Promise<{ width: number; height: number; data: Uint8Array } | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'image/png,image/jpeg', 'User-Agent': 'NorthbeatPreview/1.0' }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes[0] === 0x89 && bytes[1] === 0x50) { const png = PNG.sync.read(Buffer.from(bytes)); return { width: png.width, height: png.height, data: png.data }; }
    if (bytes[0] === 0xff && bytes[1] === 0xd8) { const j = jpeg.decode(bytes, { useTArray: true }); return { width: j.width, height: j.height, data: j.data }; }
    return null;
  } catch { return null; }
}

/** Draws a decoded RGBA image into a box on a white rounded tile, alpha-blended onto the canvas. */
function drawLogo(img: ReturnType<typeof PImage.make>, logo: { width: number; height: number; data: Uint8Array }, x: number, y: number, size: number) {
  const scale = Math.min(size / logo.width, size / logo.height);
  const w = Math.round(logo.width * scale), h = Math.round(logo.height * scale);
  const ox = x + Math.round((size - w) / 2), oy = y + Math.round((size - h) / 2);
  const out = img.data as unknown as Uint8Array;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const sx = Math.min(logo.width - 1, Math.floor(i / scale)), sy = Math.min(logo.height - 1, Math.floor(j / scale));
    const s = (sy * logo.width + sx) * 4, a = logo.data[s + 3]! / 255;
    const d = ((oy + j) * W * S + (ox + i)) * 4;
    for (let c = 0; c < 3; c++) out[d + c] = Math.round(logo.data[s + c]! * a + out[d + c]! * (1 - a));
    out[d + 3] = 255;
  }
}

/** Plum heart centred at (cx, cy); size is the heart's full height. */
function drawHeart(ctx: Ctx, cx: number, cy: number, size: number) {
  const s = size / 20; const p = (x: number, y: number) => [cx + x * s, cy + y * s] as const;
  ctx.fillStyle = COLOURS.plum; ctx.beginPath();
  ctx.moveTo(...p(0, 7.6));
  ctx.bezierCurveTo(...p(-9, 1.7), ...p(-9, -4.1), ...p(-9, -4.1));
  ctx.bezierCurveTo(...p(-9, -6.8), ...p(-6.9, -8.9), ...p(-4.4, -8.9));
  ctx.bezierCurveTo(...p(-2.6, -8.9), ...p(-1, -7.9), ...p(0, -6.4));
  ctx.bezierCurveTo(...p(1, -7.9), ...p(2.6, -8.9), ...p(4.4, -8.9));
  ctx.bezierCurveTo(...p(6.9, -8.9), ...p(9, -6.8), ...p(9, -4.1));
  ctx.bezierCurveTo(...p(9, 1.7), ...p(0, 7.6), ...p(0, 7.6));
  ctx.closePath(); ctx.fill();
}

/** Heart inside the O of a drawn NORTHBEAT: centred in the counter at 53% of the cap height. */
function wordmarkHeart(ctx: Ctx, x: number, baseline: number, fontPt: number) {
  const oX = x + ctx.measureText('N').width + ctx.measureText('O').width / 2;
  drawHeart(ctx, oX, baseline - fontPt * 0.7 * 0.53, fontPt * 0.17);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill();
}

export type OgInput = { eyebrow: string; title: string; subtitle?: string | null; logoUrl?: string | null; logoTone?:string|null|undefined;logoName?:string|undefined; home?: boolean };

export async function renderOgPng(input: OgInput): Promise<Uint8Array> {
  fontsReady ??= loadFonts().catch(e => { fontsReady = null; throw e; });
  await fontsReady;
  const img = PImage.make(W * S, H * S);
  const ctx = img.getContext('2d');
  ctx.scale(S, S);
  ctx.fillStyle = COLOURS.paper; ctx.fillRect(0, 0, W, H);
  const pad = 80;
  // Flat heartbeat line along the bottom, one beat in plum.
  ctx.strokeStyle = COLOURS.ink; ctx.lineWidth = 3 * S; ctx.beginPath(); ctx.moveTo(0, 580); ctx.lineTo(880, 580); ctx.lineTo(905, 546); ctx.lineTo(930, 612); ctx.lineTo(955, 580); ctx.lineTo(W, 580); ctx.stroke();
  ctx.fillStyle = COLOURS.plum; ctx.beginPath(); ctx.arc(905, 546, 8, 0, Math.PI * 2); ctx.fill();
  if (input.home) {
    ctx.fillStyle = COLOURS.ink; ctx.font = '150pt Bodoni';
    const word = 'NORTHBEAT'; const w = ctx.measureText(word).width; const wx = (W - w) / 2;
    serif(ctx, word, wx, 300, COLOURS.ink); wordmarkHeart(ctx, wx, 300, 150);
    ctx.font = '40pt Body'; ctx.fillStyle = COLOURS.muted; const t = 'The heartbeat of Nordic health innovation.'; ctx.fillText(t, (W - ctx.measureText(t).width) / 2, 390);
    return encode(img);
  }
  let textX = pad;
  const logo = input.logoUrl ? await decodeLogo(input.logoUrl) : null;
  const tile=Boolean(logo||input.logoName);
  if (tile) {
    ctx.fillStyle = COLOURS.hairline; roundRect(ctx, pad - 2, pad - 2, 124, 124, 22);
    ctx.fillStyle = input.logoTone==='light'?COLOURS.ink:COLOURS.white; roundRect(ctx, pad, pad, 120, 120, 20);
    if(logo)drawLogo(img, logo, (pad + 14.4) * S, (pad + 14.4) * S, 91.2 * S);
    else{ctx.font='15pt Body';ctx.fillStyle=input.logoTone==='light'?COLOURS.white:COLOURS.ink;const names=wrap(ctx,input.logoName??input.title,100,4);names.forEach((n,i)=>ctx.fillText(n,pad+10,pad+30+i*22));}
  }
  const top = tile ? pad + 120 + 60 : pad + 60;
  ctx.fillStyle = COLOURS.plum; ctx.font = '30pt Body'; ctx.fillText(input.eyebrow, textX, top);
  ctx.fillStyle = COLOURS.ink; ctx.font = '64pt Bodoni';
  const lines = wrap(ctx, input.title, W - pad * 2, tile ? 2 : 3);
  lines.forEach((line, i) => serif(ctx, line, textX, top + 84 + i * 80, COLOURS.ink));
  if (input.subtitle) { ctx.font = '30pt Body'; ctx.fillStyle = COLOURS.muted; const sub = wrap(ctx, input.subtitle, W - pad * 2, 1)[0]!; ctx.fillText(sub, textX, top + 84 + lines.length * 80 + 4); }
  ctx.font = '30pt Bodoni'; ctx.fillStyle = COLOURS.ink; const bx = W - pad - ctx.measureText('NORTHBEAT').width;
  serif(ctx, 'NORTHBEAT', bx, pad + 30, COLOURS.ink); wordmarkHeart(ctx, bx, pad + 30, 30);
  return encode(img);
}

function encode(img: ReturnType<typeof PImage.make>) {
  const src = img.data as unknown as Uint8Array, out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let c = 0; c < 4; c++) {
    let sum = 0; for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) sum += src[((y * S + dy) * W * S + (x * S + dx)) * 4 + c]!;
    out[(y * W + x) * 4 + c] = Math.round(sum / (S * S));
  }
  const png = new PNG({ width: W, height: H });
  png.data = out;
  return new Uint8Array(PNG.sync.write(png));
}
