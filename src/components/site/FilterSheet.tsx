import type { ReactNode } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function FilterSheet({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" className="theme-site nb-filter-sheet" aria-describedby={undefined}>
    <SheetTitle className="mb-6 text-left font-normal">Filters</SheetTitle>
    <div data-native-scroll className="nb-filter-sheet-body">{children}</div>
    <Button className="nb-btn nb-btn-primary mt-6 w-full" onClick={() => onOpenChange(false)}>Show results</Button>
  </SheetContent></Sheet>;
}