import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

/** Decorative navigation mark; the enclosing link or button supplies its label. */
export function PulseArrow({ className, direction = 'right', ...props }: SVGProps<SVGSVGElement> & { direction?: 'right' | 'left' }) {
  return <svg {...props} viewBox="0 0 32 18" className={cn('nb-pulse-arrow', className)} data-direction={direction} aria-hidden="true" focusable="false">
    <g transform={direction === 'left' ? 'translate(32 18) rotate(180)' : undefined}><use href="/pulse-arrow.svg#pulse-arrow" /></g>
  </svg>;
}