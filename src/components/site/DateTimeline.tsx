import { type ReactNode } from 'react';
import { dayKey, monthLabel } from '@/lib/events';
import { timelineRows } from '@/lib/timeline';

export function DateTimeline<T>({ items, date, now, earlier = false, children }: { items: T[]; date: (item: T) => string | null; now: string; earlier?: boolean; children: (item: T) => ReactNode }) {
  const rows = timelineRows(items, date, now);
  const groups: { month: string; rows: typeof rows }[] = [];
  for (const row of rows) {
    const month = row.date ? dayKey(row.date).slice(0, 7) : '';
    const last = groups.at(-1);
    if (last?.month === month) last.rows.push(row);
    else groups.push({ month, rows: [row] });
  }
  return <section className={`nb-date-timeline${earlier ? ' nb-timeline-earlier' : ''}`} aria-label={earlier ? 'Earlier' : 'Timeline'}>
    {earlier && <h2 className="nb-h3 mb-6 text-muted-foreground">Earlier</h2>}
    <div className="nb-timeline-track"><span className="nb-timeline-fill" data-scroll-fill aria-hidden />
      {groups.map(group => <div key={group.month || 'undated'}>
        {group.month && <h3 className="nb-timeline-month">{monthLabel(group.month)}</h3>}
        {group.rows.map((row, i) => row.kind === 'today' ? <div key="today" className="nb-timeline-today"><span />Today<time className="sr-only" dateTime={row.date}>{dayKey(row.date)}</time></div> : <div key={i} className="nb-timeline-item">{children(row.item)}</div>)}
      </div>)}
    </div>
  </section>;
}