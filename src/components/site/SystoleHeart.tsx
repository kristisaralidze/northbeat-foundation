import { useEffect, useRef, useState, type FormEvent, type CSSProperties } from 'react';
import { useServerFn } from '@tanstack/react-start';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { PulseArrow } from '@/components/ui/pulse-arrow';
import { SystoleGlobe } from './SystoleGlobe';
import { joinSystoleWaitlist } from '@/lib/site.functions';

const HEART = 'M0 7.6C0 7.6-9 1.7-9-4.1-9-6.8-6.9-8.9-4.4-8.9-2.6-8.9-1-7.9 0-6.4 1-7.9 2.6-8.9 4.4-8.9 6.9-8.9 9-6.8 9-4.1 9 1.7 0 7.6 0 7.6Z';
const LETTERS = Array.from('systole');
function Heart() {
  return <svg viewBox="-10 -10 20 20" className="nb-systole-tab-heart" aria-hidden="true"><path className="nb-wordmark-heart-beat" d={HEART} /></svg>;
}
function SystoleWord() {
  const host = useRef<SVGSVGElement>(null);
  const [metrics, setMetrics] = useState({ cap: 65, width: 275, positions: [0, 35, 78, 113, 143, 188, 212], widths: [35,43,35,30,45,24,42] });
  useEffect(() => {
    let cancelled = false;
    void document.fonts.load('italic 800 92px "Bodoni Moda"').then(() => document.fonts.ready).then(() => {
      if (cancelled || !host.current) return;
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return;
      ctx.font = 'italic 800 92px "Bodoni Moda"';
      const widths = LETTERS.map(letter => ctx.measureText(letter).width);
      let width = 0;
      const positions = widths.map(w => { const x = width; width += w - 1.84; return x; });
      setMetrics({ cap: ctx.measureText('o').actualBoundingBoxAscent || 45, width: width + 1.84, positions, widths });
    });
    return () => { cancelled = true; };
  }, []);
  const x = (metrics.positions[4] ?? 0) + (metrics.widths[4] ?? 0) / 2;
  return <svg ref={host} viewBox={`-8 0 ${metrics.width + 16} 120`} className="nb-systole-word-svg" aria-hidden="true">
    {LETTERS.map((letter, i) => <g key={i} className="nb-systole-letter" style={{ '--spread': i - 3 } as CSSProperties}>
      <text x={metrics.positions[i]} y="85">{letter}</text>
      {i === 4 && <g transform={`translate(${x} ${85 - metrics.cap * .47}) scale(.782)`}><path d={HEART} className="nb-wordmark-heart-beat" /></g>}
    </g>)}
  </svg>;
}

/** Shared edge tab and accessible, portalled Systole signup sheet. */
export function SystoleHeart({ pathname }: { pathname: string }) {
  const join = useServerFn(joinSystoleWaitlist);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const update = () => {
      const target = document.querySelector<HTMLElement>('.nb-heartbeat');
      if (!target || target.classList.contains('nb-heartbeat-reduced')) { setHidden(false); return; }
      const r = target.getBoundingClientRect();
      setHidden(r.top < window.innerHeight && r.bottom > 0 && target.dataset['flight'] === 'true');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('northbeat:flight', update);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('northbeat:flight', update); window.removeEventListener('resize', update); };
  }, [pathname]);

  useEffect(() => {
    const show = () => setOpen(true);
    const checkLink = () => { if (new URLSearchParams(window.location.search).get('systole') === '1') show(); };
    checkLink();
    window.addEventListener('northbeat:open-systole', show);
    window.addEventListener('popstate', checkLink);
    return () => { window.removeEventListener('northbeat:open-systole', show); window.removeEventListener('popstate', checkLink); };
  }, [pathname]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setState('busy');
    try { await join({ data: { email } }); setState('done'); setEmail(''); } catch { setState('error'); }
  };
  const share = async () => {
    const url = new URL(window.location.href); url.searchParams.set('systole', '1');
    try { await navigator.clipboard.writeText(url.toString()); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  };

  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,500;1,6..96,800&display=swap" />
    <Dialog.Trigger asChild><Button ref={button} variant="ghost" className="nb-systole-tab" data-hidden={hidden && !open} aria-hidden={hidden && !open} tabIndex={hidden && !open ? -1 : 0} aria-label="Open Systole">
      <span>systole</span><Heart />
    </Button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="theme-site nb-systole-overlay" />
      <Dialog.Content className="theme-site nb-systole-sheet" aria-describedby="systole-description" data-native-scroll onCloseAutoFocus={e => { e.preventDefault(); button.current?.focus(); }}>
        <div className="nb-systole-sheet-top"><span>Coming next</span><Dialog.Close asChild><Button variant="link" className="nb-systole-text-action nb-systole-close">Close</Button></Dialog.Close></div>
        <div className="nb-systole-sheet-main">
          <Dialog.Title className="nb-systole-sheet-title"><span className="sr-only">systole</span><SystoleWord /></Dialog.Title>
          <Dialog.Description id="systole-description" className="nb-systole-sheet-message">NorthBeat is cooking something cool for you.</Dialog.Description>
          <p className="nb-systole-sheet-detail">Helsinki. Spring 2027.</p>
          <p className="nb-systole-sheet-detail">Stay tuned.</p>
          {open && <SystoleGlobe />}
        </div>
        <div className="nb-systole-sheet-bottom">
          {state === 'done' ? <div className="nb-systole-success"><p role="status">You're on the list.</p><Button variant="link" className="nb-systole-text-action" onClick={share}>Send it to a friend</Button><p role="status" className="nb-systole-feedback">{copied ? 'Link copied.' : copyError ? "Couldn't copy the link. Please try again." : ''}</p></div> :
            <form onSubmit={submit} className="nb-systole-sheet-form">
              <label htmlFor="systole-heart-email">Hear it first</label>
              <input id="systole-heart-email" type="email" required autoComplete="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
              <Button variant="link" type="submit" className="nb-systole-text-action nb-systole-notify" disabled={state === 'busy'}>{state === 'busy' ? 'Saving…' : <>Notify me <PulseArrow /></>}</Button>
              <p role="status" aria-live="polite" className="nb-systole-feedback">{state === 'error' ? "That didn't work. Check the email address and try again." : ''}</p>
            </form>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
