/** Thin heartbeat pulse line: the Northbeat signature divider. */
export function PulseLine({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`} aria-hidden="true" role="presentation">
      <span className="h-px flex-1 bg-hairline" />
      <svg width="64" height="16" viewBox="0 0 64 16" fill="none" className="shrink-0 text-berry">
        <path d="M0 8h20l4-6 6 12 5-9 3 3h26" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="nb-wordmark text-ink">
        Northbeat
      </span>
      <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden="true" className="text-berry">
        <path d="M0 6h7l2.5-5 3.5 10 3-7 2 2h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
