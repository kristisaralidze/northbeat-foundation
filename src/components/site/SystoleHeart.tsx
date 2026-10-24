import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { X } from 'lucide-react';
import { joinSystoleWaitlist } from '@/lib/site.functions';

const LINE = 'M2 12h6l2-5 3 10 3-8 2 3h4';

/** Floating beating heart button on every page; opens the Systole waitlist panel. */
export function SystoleHeart({ pathname }: { pathname: string }) {
  const join = useServerFn(joinSystoleWaitlist);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const button = useRef<HTMLButtonElement>(null);

  // Hide while the home heartbeat section is on screen, so the Next up card is never covered.
  useEffect(() => {
    setHidden(false);
    const target = document.querySelector('.nb-heartbeat');
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => setHidden(Boolean(entry?.isIntersecting)));
    io.observe(target);
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('northbeat:open-systole', show);
    return () => window.removeEventListener('northbeat:open-systole', show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => { setOpen(false); button.current?.focus(); };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setState('busy');
    try { await join({ data: { email } }); setState('done'); setEmail(''); } catch { setState('error'); }
  };

  return <>
    <button ref={button} type="button" className="nb-heart-button" data-hidden={hidden && !open} aria-hidden={hidden && !open} tabIndex={hidden && !open ? -1 : 0}
      aria-haspopup="dialog" aria-expanded={open} aria-controls="systole-panel" aria-label="Something is coming" onClick={() => setOpen(o => !o)}>
      <span className="nb-heart-label" aria-hidden="true">Something is coming</span>
      <span className="nb-heart-circle" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path className="nb-heart-line" d={LINE} pathLength={1} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </button>
    {open && <>
      <div className="nb-heart-backdrop" onClick={close} aria-hidden="true" />
      <div id="systole-panel" role="dialog" aria-modal="true" aria-labelledby="systole-title" className="nb-heart-panel">
        <button type="button" className="nb-heart-close" aria-label="Close" onClick={close} autoFocus><X className="h-5 w-5" aria-hidden /></button>
        <svg className="nb-heart-panel-line" viewBox="0 0 300 24" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path d="M0 12h120l8-10 12 20 10-14 6 4h144" pathLength={1} stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 id="systole-title" className="nb-heart-word">SYSTOLE</h2>
        <p className="nb-heart-text">Something big for health and AI is coming to Helsinki.</p>
        <p className="nb-heart-text">Spring 2027.</p>
        {state === 'done' ? <p className="nb-heart-text mt-6" role="status">You're on the list. We'll tell you first.</p> :
          <form onSubmit={submit} noValidate className="mt-6">
            <label htmlFor="systole-heart-email" className="nb-heart-text block">Be the first to know.</label>
            <div className="nb-heart-row">
              <input id="systole-heart-email" type="email" required autoComplete="email" placeholder="Your email" className="nb-systole-input" value={email} onChange={e => setEmail(e.target.value)} />
              <button type="submit" className="nb-systole-button" disabled={state === 'busy'}>{state === 'busy' ? 'Saving…' : 'Notify me'}</button>
            </div>
            <p role="status" aria-live="polite" className="nb-systole-error">{state === 'error' ? "That didn't work. Check the email address and try again." : ''}</p>
          </form>}
      </div>
    </>}
  </>;
}
