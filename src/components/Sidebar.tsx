import { useState } from 'react'
import { useSessionStore } from '../store/session'
import { useUIStore } from '../store/ui'
import { useConnectionStore } from '../store/connection'
import { Plus, Search } from 'lucide-react'
import { showContextMenu } from './ContextMenu'
import type { AgentID } from '../store/ui'

const agentColors: Record<AgentID, string> = {
  build: 'bg-agent-build',
  plan: 'bg-agent-plan',
  compose: 'bg-agent-compose',
}

function formatSessionTitle(title: string | undefined, createdAt: number): string {
  if (title && !title.startsWith('New session')) return title
  const d = new Date(createdAt)
  return `Session · ${d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return `${Math.floor(diffH / 24)}d ago`
}

export default function Sidebar() {
  const { sessions, currentID, selectSession, createSession, fetchSessions } = useSessionStore()
  const { connected, serverURL } = useConnectionStore()
  const { setView } = useUIStore()
  const [search, setSearch] = useState('')

  const filtered = search
    ? sessions.filter((s) => s.title?.toLowerCase().includes(search.toLowerCase()))
    : sessions

  const handleNewSession = async () => {
    try {
      await createSession()
      setView('chat')
    } catch {
      // ignore
    }
  }

  return (
    <aside className="w-[260px] min-w-[260px] h-full bg-bg-1 border-r border-border flex flex-col overflow-hidden">
      {/* Brand */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-[18px] h-[18px] bg-accent flex items-center justify-center font-code text-[10px] font-bold text-bg-0 shrink-0">
            M
          </div>
          <h1 className="font-ui text-[13px] font-bold tracking-tight text-text-1">MimoCode</h1>
          <span className="ml-auto text-[10px] text-text-3 font-normal">{__APP_VERSION__}</span>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-1.5 px-2 py-[5px] bg-bg-2 border border-border text-[10px] text-text-2">
          <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${connected ? 'bg-green shadow-[0_0_6px_rgba(180,240,78,0.4)]' : 'bg-red shadow-[0_0_6px_rgba(240,94,78,0.4)]'}`} />
          <span className="font-medium">{connected ? 'Connected' : 'Disconnected'}</span>
          <span className="ml-auto text-text-3 font-mono text-[9px] truncate max-w-[110px]">
            {serverURL.replace(/^https?:\/\//, '')}
          </span>
        </div>
      </div>

      {/* New session */}
      <button
        onClick={handleNewSession}
        className="mx-3.5 mt-2.5 mb-1.5 py-[5px] flex items-center justify-center gap-1.5 border border-dashed border-border-bright text-text-3 text-[10px] uppercase tracking-[0.06em] hover:border-accent hover:text-accent hover:bg-accent-dim transition-colors cursor-pointer bg-transparent font-mono"
      >
        <Plus size={10} />
        New Session
        <kbd className="text-[9px] px-1 bg-bg-3 border border-border text-text-3">⌘K</kbd>
      </button>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-1">
        <div className="px-3.5 pt-2 pb-0.5 flex items-center gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-text-3 font-ui">Sessions</span>
        </div>
        <div className="px-3.5 pb-1">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-bg-2 border border-border">
            <Search size={10} className="text-text-3 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none text-[11px] text-text-1 placeholder:text-text-3 font-mono"
            />
          </div>
        </div>
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => { selectSession(s.id); setView('chat') }}
            onContextMenu={(e) => {
              e.preventDefault()
              showContextMenu(e.clientX, e.clientY, [
                {
                  label: 'Open',
                  icon: '→',
                  onClick: () => { selectSession(s.id); setView('chat') },
                },
                {
                  label: 'Copy ID',
                  icon: '⊞',
                  shortcut: '⌘C',
                  onClick: () => navigator.clipboard.writeText(s.id),
                },
                {
                  label: 'Export as JSON',
                  icon: '↓',
                  onClick: async () => {
                    const base = useConnectionStore.getState().serverURL
                    const res = await fetch(`${base}/session/${s.id}/message`)
                    const data = await res.json()
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${s.title || s.id}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  },
                },
                { label: '', onClick: () => {} }, // separator
                {
                  label: 'Delete',
                  icon: '✕',
                  danger: true,
                  onClick: async () => {
                    if (!confirm(`Delete session "${s.title || s.id}"?`)) return
                    const base = useConnectionStore.getState().serverURL
                    await fetch(`${base}/session/${s.id}`, { method: 'DELETE' })
                    fetchSessions()
                  },
                },
              ])
            }}
            className={`w-full text-left flex flex-col px-3.5 py-[5px] border-l-2 cursor-pointer transition-colors gap-0.5 bg-transparent border-0 border-l-solid ${
              currentID === s.id
                ? 'bg-bg-2 border-l-accent'
                : 'border-l-transparent hover:bg-bg-2'
            }`}
          >
            <span className="text-[11px] text-text-1 font-medium truncate">
              {formatSessionTitle(s.title, s.time.created)}
            </span>
            <div className="flex items-center gap-1.5 text-[9px] text-text-3">
              <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${agentColors.build}`} />
              <span>build</span>
              <span>·</span>
              <span>{formatTime(s.time.updated)}</span>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-3.5 py-4 text-[10px] text-text-3">No sessions</div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3.5 py-2">
        <div className="flex items-center gap-1.5 text-[10px] text-text-3">
          <span className="w-[5px] h-[5px] rounded-full bg-green" />
          <span>mimo serve</span>
        </div>
      </div>
    </aside>
  )
}
