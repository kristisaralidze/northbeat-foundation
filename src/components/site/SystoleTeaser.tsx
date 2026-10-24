import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { joinSystoleWaitlist } from '@/lib/site.functions';

export function SystoleTeaser() {
  const join = useServerFn(joinSystoleWaitlist);
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el); return () => io.disconnect();
  }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setState('busy');
    try { await join({ data: { email } }); setState('done'); setEmail(''); } catch { setState('error'); }
  };
  return <section ref={ref} className="nb-systole" data-shown={shown} aria-labelledby="systole-heading">
    <div className="nb-container nb-systole-inner">
      <h2 id="systole-heading" className="nb-systole-word">SYSTOLE</h2>
      <p className="nb-systole-line">Spring 2027. Helsinki. Something big for health and AI.</p>
      {state === 'done' ? <p className="nb-systole-thanks" role="status">Thank you. You'll be the first to know.</p> :
      <form onSubmit={submit} className="nb-systole-form" noValidate>
        <label htmlFor="systole-email" className="nb-systole-label">Be the first to know</label>
        <div className="nb-systole-row">
          <input id="systole-email" type="email" required autoComplete="email" placeholder="you@company.fi" className="nb-systole-input" value={email} onChange={e => setEmail(e.target.value)} />
          <button type="submit" className="nb-systole-button" disabled={state === 'busy'}>{state === 'busy' ? 'Saving…' : 'Notify me'}</button>
        </div>
        <p role="status" aria-live="polite" className="nb-systole-error">{state === 'error' ? 'That didn\'t work. Check the email address and try again.' : ''}</p>
      </form>}
    </div>
  </section>;
}
