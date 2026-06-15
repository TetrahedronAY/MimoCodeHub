import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

interface Props {
  text: string
}

export default function ReasoningPart({ text }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="my-1.5 border border-border bg-bg-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-2.5 py-[5px] cursor-pointer select-none hover:bg-bg-3 transition-colors bg-transparent border-0 text-left"
      >
        <ChevronRight
          size={8}
          className={`text-text-3 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <span className="text-[9px] uppercase tracking-[0.08em] text-text-3 font-medium">
          Reasoning
        </span>
      </button>
      {open && (
        <div className="px-2.5 py-2 border-t border-border text-[11px] text-text-2 italic leading-relaxed">
          {text}
        </div>
      )}
    </div>
  )
}
