import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { ToolPart } from '../../api/types'

const statusColors: Record<string, string> = {
  completed: 'bg-green',
  running: 'bg-amber animate-[pulse_1.2s_ease-in-out_infinite]',
  error: 'bg-red',
}

export default function ToolCallPart({ tool, state }: ToolPart) {
  const [open, setOpen] = useState(false)

  return (
    <div className="my-1.5 border border-border bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-2.5 py-[5px] cursor-pointer select-none hover:bg-bg-2 transition-colors bg-transparent border-0 text-left ${open ? '' : ''}`}
      >
        <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${statusColors[state.status] || 'border-[1.5px] border-text-3 bg-transparent'}`} />
        <span className="font-code text-[11px] font-medium text-text-1">{tool}</span>
        <ChevronRight
          size={8}
          className={`ml-auto text-text-3 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-border">
          {state.input && (
            <div className="px-2.5 py-2 border-b border-border">
              <div className="text-[9px] uppercase tracking-[0.08em] text-text-3 font-medium mb-1">
                Input
              </div>
              <pre className="bg-bg-1 border border-border p-2 font-code text-[11px] leading-[1.5] overflow-x-auto text-text-2 max-h-[200px] overflow-y-auto whitespace-pre">
                {typeof state.input === 'string'
                  ? state.input
                  : JSON.stringify(state.input, null, 2)}
              </pre>
            </div>
          )}
          {state.output && (
            <div className="px-2.5 py-2">
              <div className="text-[9px] uppercase tracking-[0.08em] text-text-3 font-medium mb-1">
                Output
              </div>
              <pre className="bg-bg-1 border border-border p-2 font-code text-[11px] leading-[1.5] overflow-x-auto text-text-2 max-h-[200px] overflow-y-auto whitespace-pre">
                {state.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
