import { useEffect, useMemo } from 'react'
import { useSessionStore } from '../store/session'
import { useMessageStore } from '../store/message'
import { getMessages } from '../api/client'

export default function StatsView() {
  const { sessions } = useSessionStore()
  const { messages } = useMessageStore()

  // Fetch messages for all sessions to compute stats
  useEffect(() => {
    sessions.forEach(async (s) => {
      if (!messages[s.id]) {
        try {
          const msgs = await getMessages(s.id)
          useMessageStore.setState((prev) => ({
            messages: { ...prev.messages, [s.id]: msgs },
          }))
        } catch { /* ignore */ }
      }
    })
  }, [sessions])

  const stats = useMemo(() => {
    let totalInput = 0
    let totalOutput = 0
    let totalCost = 0
    let toolCallCount = 0
    const modelCounts: Record<string, number> = {}

    for (const sid of Object.keys(messages)) {
      for (const msg of messages[sid] || []) {
        if (msg.info.tokens) {
          totalInput += msg.info.tokens.input || 0
          totalOutput += msg.info.tokens.output || 0
        }
        if (msg.info.cost) totalCost += msg.info.cost
        if (msg.info.model) {
          const key = msg.info.model.modelID || 'unknown'
          modelCounts[key] = (modelCounts[key] || 0) + 1
        }
        for (const part of msg.parts) {
          if (part.type === 'tool') toolCallCount++
        }
      }
    }

    return { totalInput, totalOutput, totalCost, toolCallCount, modelCounts }
  }, [messages])

  const totalTokens = stats.totalInput + stats.totalOutput

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="bg-bg-2 border border-border p-3">
          <div className="text-[9px] uppercase tracking-[0.08em] text-text-3 mb-1">Total Tokens</div>
          <div className="font-ui text-xl font-bold text-accent">{formatNumber(totalTokens)}</div>
          <div className="text-[9px] text-text-3 mt-0.5">
            ↑ {formatNumber(stats.totalInput)} · ↓ {formatNumber(stats.totalOutput)}
          </div>
        </div>
        <div className="bg-bg-2 border border-border p-3">
          <div className="text-[9px] uppercase tracking-[0.08em] text-text-3 mb-1">Total Cost</div>
          <div className="font-ui text-xl font-bold text-text-1">${stats.totalCost.toFixed(2)}</div>
          <div className="text-[9px] text-text-3 mt-0.5">MiMo Auto (free)</div>
        </div>
        <div className="bg-bg-2 border border-border p-3">
          <div className="text-[9px] uppercase tracking-[0.08em] text-text-3 mb-1">Sessions</div>
          <div className="font-ui text-xl font-bold text-text-1">{sessions.length}</div>
        </div>
        <div className="bg-bg-2 border border-border p-3">
          <div className="text-[9px] uppercase tracking-[0.08em] text-text-3 mb-1">Tool Calls</div>
          <div className="font-ui text-xl font-bold text-text-1">{stats.toolCallCount}</div>
        </div>
      </div>

      {Object.keys(stats.modelCounts).length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-text-3 font-semibold mb-3">Model Usage</div>
          <div className="flex flex-col gap-2">
            {Object.entries(stats.modelCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([model, count]) => {
                const max = Math.max(...Object.values(stats.modelCounts))
                const pct = Math.round((count / max) * 100)
                return (
                  <div key={model} className="flex items-center gap-3 text-[11px]">
                    <span className="w-[140px] text-text-2 font-code truncate">{model}</span>
                    <div className="flex-1 h-[6px] bg-bg-3">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-[30px] text-right text-text-3 tabular-nums text-[10px]">{count}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
