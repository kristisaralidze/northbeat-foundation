import { useLayoutEffect, useRef, type ReactNode } from 'react';
export function LayoutResults({ children, signature }: { children: ReactNode; signature: string }) {
  const host = useRef<HTMLDivElement>(null);
  const boxes = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const elements = host.current?.querySelectorAll<HTMLElement>('[data-result-id]');
    const next = new Map<string, DOMRect>();
    elements?.forEach(el => {
      const id = el.dataset['resultId']; if (!id) return;
      const rect = el.getBoundingClientRect(); next.set(id, rect);
      const old = boxes.current.get(id);
      if (old && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && (old.x !== rect.x || old.y !== rect.y)) el.animate([{ transform: `translate(${old.x - rect.x}px, ${old.y - rect.y}px)` }, { transform: 'translate(0, 0)' }], { duration: 240, easing: 'ease-out' });
    });
    boxes.current = next;
  }, [signature]);
  return <div ref={host} className="grid grid-cols-1 gap-6 md:grid-cols-2">{children}</div>;
}