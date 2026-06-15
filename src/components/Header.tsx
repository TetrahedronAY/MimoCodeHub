import { useUIStore, type AgentID } from '../store/ui'
import { BarChart3, Settings } from 'lucide-react'

const agents: { id: AgentID; label: string; color: string; key: string }[] = [
  { id: 'build', label: 'Build', color: 'bg-agent-build', key: '1' },
  { id: 'plan', label: 'Plan', color: 'bg-agent-plan', key: '2' },
  { id: 'compose', label: 'Compose', color: 'bg-agent-compose', key: '3' },
]

export default function Header() {
  const { activeAgent, setAgent, activeView, setView } = useUIStore()

  return (
    <header className="h-10 min-h-10 flex items-center px-4 border-b border-border bg-bg-1 gap-3 z-10">
      {/* Agent tabs */}
      <div className="flex">
        {agents.map((a) => (
          <button
            key={a.id}
            onClick={() => { setAgent(a.id); setView('chat') }}
            className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.05em] border border-transparent cursor-pointer font-mono flex items-center gap-[5px] transition-colors bg-transparent ${
              activeView === 'chat' && activeAgent === a.id
                ? 'text-text-1 bg-bg-3 border-border-bright'
                : 'text-text-3 hover:text-text-2 hover:bg-bg-2'
            }`}
          >
            <span className={`w-[5px] h-[5px] rounded-full ${a.color}`} />
            {a.label}
            <kbd className="text-[8px] px-[3px] bg-bg-4 border border-border text-text-3 leading-[1.4]">{a.key}</kbd>
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-border shrink-0" />

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <button
          onClick={() => setView('stats')}
          className={`px-2 py-[3px] text-[10px] border border-border cursor-pointer font-mono flex items-center gap-1 transition-colors bg-transparent ${
            activeView === 'stats' ? 'text-text-1 bg-bg-3 border-border-bright' : 'text-text-3 hover:border-border-bright hover:text-text-2 hover:bg-bg-2'
          }`}
        >
          <BarChart3 size={10} />
          Stats
          <kbd className="text-[8px] px-[3px] bg-bg-4 border border-border text-text-3">⌘4</kbd>
        </button>
        <button
          onClick={() => setView('settings')}
          className={`px-2 py-[3px] text-[10px] border border-border cursor-pointer font-mono flex items-center gap-1 transition-colors bg-transparent ${
            activeView === 'settings' ? 'text-text-1 bg-bg-3 border-border-bright' : 'text-text-3 hover:border-border-bright hover:text-text-2 hover:bg-bg-2'
          }`}
        >
          <Settings size={10} />
          Settings
          <kbd className="text-[8px] px-[3px] bg-bg-4 border border-border text-text-3">⌘,</kbd>
        </button>
      </div>
    </header>
  )
}
