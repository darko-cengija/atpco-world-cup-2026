/**
 * Shared avatar component. Handles three cases:
 *  - emoji:🦁  → renders the emoji
 *  - https://… → renders an <img>
 *  - null       → renders the name initial
 *
 * Pass a Tailwind size class via `className` (defaults to w-8 h-8).
 */
export function Avatar({
  url,
  name,
  className = 'w-8 h-8',
}: {
  url: string | null
  name: string
  className?: string
}) {
  return (
    <div
      className={`${className} rounded-full bg-brand-ink text-brand-ticket ring-2 ring-brand-paper flex items-center justify-center overflow-hidden shrink-0 shadow-sm`}
    >
      {url?.startsWith('emoji:') ? (
        <span className="text-base leading-none">{url.replace('emoji:', '')}</span>
      ) : url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-brand-ticket">{name[0]?.toUpperCase()}</span>
      )}
    </div>
  )
}
