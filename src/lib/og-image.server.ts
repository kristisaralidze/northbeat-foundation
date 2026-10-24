// Pure-JS link preview renderer (no native code or wasm), so it runs in the server runtime.
import * as PImage from 'pureimage';
import opentype from 'opentype.js';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400&family=Inter+Tight:wght@500';
const W = 1200, H = 630;
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
    const res = await fetch(url, { headers: { Accept: 'image/png,image/jpeg' }, signal: AbortSignal.timeout(4000) });
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
    const d = ((oy + j) * W + (ox + i)) * 4;
    for (let c = 0; c < 3; c++) out[d + c] = Math.round(logo.data[s + c]! * a + out[d + c]! * (1 - a));
    out[d + 3] = 255;
  }
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill();
}

export type OgInput = { eyebrow: string; title: string; subtitle?: string | null; logoUrl?: string | null; home?: boolean };

export async function renderOgPng(input: OgInput): Promise<Uint8Array> {
  fontsReady ??= loadFonts().catch(e => { fontsReady = null; throw e; });
  await fontsReady;
  const img = PImage.make(W, H);
  const ctx = img.getContext('2d');
  ctx.fillStyle = COLOURS.paper; ctx.fillRect(0, 0, W, H);
  const pad = 80;
  // Flat heartbeat line along the bottom, one beat in plum.
  ctx.strokeStyle = COLOURS.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 540); ctx.lineTo(880, 540); ctx.lineTo(905, 500); ctx.lineTo(930, 580); ctx.lineTo(955, 540); ctx.lineTo(W, 540); ctx.stroke();
  ctx.fillStyle = COLOURS.plum; ctx.beginPath(); ctx.arc(905, 500, 8, 0, Math.PI * 2); ctx.fill();
  if (input.home) {
    ctx.fillStyle = COLOURS.ink; ctx.font = '150pt Bodoni';
    const word = 'NORTHBEAT'; const w = ctx.measureText(word).width; ctx.fillText(word, (W - w) / 2, 300);
    ctx.font = '40pt Body'; ctx.fillStyle = COLOURS.muted; const t = 'The heartbeat of Nordic health innovation.'; ctx.fillText(t, (W - ctx.measureText(t).width) / 2, 390);
    return encode(img);
  }
  let textX = pad;
  const logo = input.logoUrl ? await decodeLogo(input.logoUrl) : null;
  if (logo) {
    ctx.fillStyle = COLOURS.hairline; roundRect(ctx, pad - 2, pad - 2, 164, 164, 26);
    ctx.fillStyle = COLOURS.white; roundRect(ctx, pad, pad, 160, 160, 24);
    drawLogo(img, logo, pad + 20, pad + 20, 120);
  }
  const top = logo ? pad + 160 + 64 : pad + 40;
  ctx.fillStyle = COLOURS.plum; ctx.font = '30pt Body'; ctx.fillText(input.eyebrow, textX, top);
  ctx.fillStyle = COLOURS.ink; ctx.font = '64pt Bodoni';
  const lines = wrap(ctx, input.title, W - pad * 2, logo ? 2 : 3);
  lines.forEach((line, i) => ctx.fillText(line, textX, top + 84 + i * 80));
  if (input.subtitle) { ctx.font = '30pt Body'; ctx.fillStyle = COLOURS.muted; const sub = wrap(ctx, input.subtitle, W - pad * 2, 1)[0]!; ctx.fillText(sub, textX, top + 84 + lines.length * 80 + 10); }
  ctx.font = '30pt Bodoni'; ctx.fillStyle = COLOURS.ink; ctx.fillText('NORTHBEAT', W - pad - ctx.measureText('NORTHBEAT').width, pad + 30);
  return encode(img);
}

function encode(img: ReturnType<typeof PImage.make>) {
  const png = new PNG({ width: W, height: H });
  png.data = Buffer.from(img.data as unknown as Uint8Array);
  return new Uint8Array(PNG.sync.write(png));
}
