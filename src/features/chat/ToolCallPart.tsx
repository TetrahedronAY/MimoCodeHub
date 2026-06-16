import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { ToolPart } from '../../api/types'

const statusColors: Record<string, string> = {
  completed: 'bg-green',
  running: 'bg-amber animate-[pulse_1.2s_ease-in-out_infinite]',
  error: 'bg-red',
}

function formatDuration(time?: { start: number; end?: number }): string {
  if (!time?.start) return ''
  const end = time.end || Date.now()
  const ms = end - time.start
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function ToolInput({ input }: { input: unknown }) {
  if (!input) return null
  const str = typeof input === 'string' ? input : JSON.stringify(input, null, 2)
  // Truncate very long outputs
  const truncated = str.length > 2000 ? str.slice(0, 2000) + '\n... (truncated)' : str
  return (
    <pre className="bg-bg-1 border border-border p-2.5 font-code text-[11px] leading-[1.5] overflow-x-auto text-text-2 max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words">
      {truncated}
    </pre>
  )
}

function ToolOutput({ output }: { output?: string }) {
  if (!output) return null
  const truncated = output.length > 3000 ? output.slice(0, 3000) + '\n... (truncated)' : output
  return (
    <pre className="bg-bg-1 border border-border p-2.5 font-code text-[11px] leading-[1.5] overflow-x-auto text-text-2 max-h-[250px] overflow-y-auto whitespace-pre-wrap break-words">
      {truncated}
    </pre>
  )
}

export default function ToolCallPart({ tool, state }: ToolPart) {
  const [open, setOpen] = useState(false)
  const duration = formatDuration(state.time)
  const hasIO = state.input || state.output

  return (
    <div className="my-1.5 border border-border bg-surface transition-colors hover:border-border-bright">
      <button
        onClick={() => hasIO && setOpen(!open)}
        className={`w-full flex items-center gap-2 px-2.5 py-[5px] transition-colors bg-transparent border-0 text-left ${
          hasIO ? 'cursor-pointer select-none hover:bg-bg-2' : 'cursor-default'
        }`}
      >
        <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${statusColors[state.status] || 'border-[1.5px] border-text-3 bg-transparent'}`} />
        <span className="font-code text-[11px] font-medium text-text-1">{tool}</span>
        {state.title && state.title !== tool && (
          <span className="text-[10px] text-text-3 truncate max-w-[200px]">{state.title}</span>
        )}
        {duration && (
          <span className="ml-auto text-[9px] text-text-3 tabular-nums font-code shrink-0 mr-1">{duration}</span>
        )}
        {hasIO && (
          <ChevronRight
            size={8}
            className={`text-text-3 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`}
          />
        )}
      </button>

      {open && hasIO && (
        <div className="border-t border-border">
          {state.input && (
            <div className="px-2.5 py-2 border-b border-border">
              <div className="text-[9px] uppercase tracking-[0.08em] text-text-3 font-medium mb-1.5">Input</div>
              <ToolInput input={state.input} />
            </div>
          )}
          {state.output && (
            <div className="px-2.5 py-2">
              <div className="text-[9px] uppercase tracking-[0.08em] text-text-3 font-medium mb-1.5">Output</div>
              <ToolOutput output={state.output} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
