import { useEffect, useState } from 'react'
import { useConnectionStore } from '../store/connection'
import { getConfig, getAgents } from '../api/client'
import type { Config, Agent } from '../api/types'

export default function SettingsView() {
  const { connected, serverURL } = useConnectionStore()
  const [config, setConfig] = useState<Config | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    if (!connected) return
    getConfig().then(setConfig).catch(() => {})
    getAgents().then(setAgents).catch(() => {})
  }, [connected])

  return (
    <div className="flex-1 overflow-y-auto p-5 max-w-2xl">
      {/* Connection */}
      <Section title="Connection">
        <Row label="Server" value={serverURL.replace(/^https?:\/\//, '')} />
        <Row
          label="Status"
          value={connected ? 'Connected' : 'Disconnected'}
          badge={connected ? 'active' : 'error'}
        />
      </Section>

      {/* Providers */}
      {config?.provider && typeof config.provider === 'object' && (
        <Section title="Providers">
          {Object.entries(config.provider as Record<string, { name?: string; models?: Record<string, unknown> }>).map(([id, p]) => (
            <Row key={id} label={p.name || id} value={`${Object.keys(p.models || {}).length} models`} />
          ))}
        </Section>
      )}

      {/* Agents */}
      {agents.length > 0 && (
        <Section title="Agents">
          {agents.filter((a) => ['build', 'plan', 'compose'].includes(a.name)).map((a) => (
            <Row
              key={a.name}
              label={
                <span className="flex items-center gap-1.5">
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: a.color || '#888' }} />
                  {a.name}
                </span>
              }
              value={a.description?.slice(0, 50) || a.name}
            />
          ))}
        </Section>
      )}

      {/* User */}
      {config?.username && (
        <Section title="Account">
          <Row label="Username" value={config.username} />
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-[9px] uppercase tracking-[0.1em] text-text-3 font-semibold mb-2 pb-1 border-b border-border">
        {title}
      </div>
      {children}
    </div>
  )
}

function Row({
  label,
  value,
  badge,
}: {
  label: React.ReactNode
  value: string
  badge?: 'active' | 'error'
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-[11px] text-text-2">{label}</span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className={`text-[9px] px-1.5 py-[2px] border ${
            badge === 'active' ? 'border-accent text-accent' : 'border-red text-red'
          }`}>
            {value}
          </span>
        )}
        {!badge && (
          <span className="text-[11px] text-text-1 font-code">{value}</span>
        )}
      </div>
    </div>
  )
}
