export function TicketMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <div
      className={`${className} shrink-0 rounded-lg border-2 border-brand-ink p-0.5 text-brand-ink`}
      aria-hidden="true"
    >
      <div className="grid h-full w-full place-items-center rounded border border-brand-ink/70 font-display text-[0.9rem] leading-none">
        26
      </div>
    </div>
  )
}

export function TicketSpinner({ label }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-brand-ink">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-ink border-t-transparent" />
      {label && <span className="ticket-meta">{label}</span>}
    </div>
  )
}
