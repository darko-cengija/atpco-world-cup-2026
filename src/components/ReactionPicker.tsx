import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'

const QUICK = ['💙', '😂', '😮', '😢', '🙏']

const ALL = [
  '💙', '❤️', '🧡', '💛', '💚', '💜',
  '👍', '👎', '👏', '🙏', '💪', '🤝',
  '😂', '🤣', '😅', '😭', '😢', '😮',
  '😍', '🥹', '😎', '😡', '🤔', '🤯',
  '🔥', '💯', '🎉', '⚽', '🏆', '✅',
  '🫡', '🥳', '🤦', '🤷', '👀', '💀',
]

interface Props {
  rect: DOMRect
  onSelect: (emoji: string) => void
  onClose: () => void
}

export function ReactionPicker({ rect, onSelect, onClose }: Props) {
  const [expanded, setExpanded] = useState(false)
  const ignoreBackdropUntil = useRef(0)

  const pickerW = 264
  const pickerH = expanded ? 280 : 56

  const gap = 8
  let top = rect.top - pickerH - gap
  if (top < 60) top = rect.bottom + gap

  let left = rect.left + rect.width / 2 - pickerW / 2
  left = Math.max(8, Math.min(left, window.innerWidth - pickerW - 8))

  function expandPicker() {
    ignoreBackdropUntil.current = Date.now() + 400
    setExpanded(true)
  }

  function closeFromBackdrop() {
    if (Date.now() < ignoreBackdropUntil.current) return
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onPointerDown={closeFromBackdrop} />
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.12 }}
        style={{ top, left, width: pickerW }}
        onPointerDown={(e) => e.stopPropagation()}
        className="fixed z-50 bg-brand-card border border-brand-border rounded-2xl shadow-2xl p-2"
      >
        {!expanded ? (
          <div className="flex items-center gap-0.5">
            {QUICK.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => { e.stopPropagation(); onSelect(emoji) }}
                className="text-2xl w-10 h-10 flex items-center justify-center rounded-full active:bg-brand-border active:scale-90 transition-transform"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={(e) => { e.stopPropagation(); expandPicker() }}
              aria-label="More reactions"
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 active:bg-brand-border transition-colors"
            >
              <MoreHorizontal size={22} />
            </button>
          </div>
        ) : (
          <div className="grid max-h-[70vh] grid-cols-6 gap-0.5 overflow-y-auto overscroll-contain touch-pan-y">
            {ALL.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => { e.stopPropagation(); onSelect(emoji) }}
                className="text-2xl w-10 h-10 flex items-center justify-center rounded-full active:bg-brand-border active:scale-90 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </>
  )
}
