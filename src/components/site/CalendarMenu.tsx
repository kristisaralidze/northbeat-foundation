import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { eventCalendar, googleCalendar, outlookCalendar, type CalendarEvent } from '@/lib/detail';

function download(value: CalendarEvent, slug: string) {
  const url = URL.createObjectURL(new Blob([eventCalendar(value)], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `${slug}.ics`; a.click(); URL.revokeObjectURL(url);
}
/** One button with Google, Apple (.ics) and Outlook options. */
export function CalendarMenu({ event, slug, label = 'Add to calendar', compact = false }: { event: CalendarEvent; slug: string; label?: string; compact?: boolean }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className={`nb-btn nb-btn-secondary${compact ? ' nb-btn-compact' : ''}`}>{label}</Button></DropdownMenuTrigger><DropdownMenuContent align="start" className="theme-site">
    <DropdownMenuItem onSelect={() => window.open(googleCalendar(event), '_blank', 'noopener,noreferrer')}>Google</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => download(event, slug)}>Apple (.ics)</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => download(event, slug)}>Outlook (.ics)</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => window.open(outlookCalendar(event), '_blank', 'noopener,noreferrer')}>Outlook on the web</DropdownMenuItem>
  </DropdownMenuContent></DropdownMenu>;
}
