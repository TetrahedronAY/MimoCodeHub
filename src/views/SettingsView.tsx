import { useEffect, useState } from 'react'
import { useConnectionStore } from '../store/connection'
import { useThemeStore, themes, accentColors } from '../store/theme'
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
      {/* Appearance */}
      <AppearanceSection />

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
              value={a.description || a.name}
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

function AppearanceSection() {
  const { currentThemeID, currentAccent, setTheme, setAccent } = useThemeStore()

  return (
    <Section title="Appearance">
      <div className="flex items-center justify-between py-1.5 border-b border-border">
        <span className="text-[11px] text-text-2">Theme</span>
        <div className="flex gap-1">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`px-2 py-[3px] text-[10px] font-mono border cursor-pointer transition-colors ${
                currentThemeID === t.id
                  ? 'border-accent text-accent bg-accent-dim'
                  : 'border-border text-text-3 bg-transparent hover:border-border-bright hover:text-text-2'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between py-1.5">
        <span className="text-[11px] text-text-2">Accent Color</span>
        <div className="flex gap-1.5">
          {accentColors.map((c) => (
            <button
              key={c.label}
              onClick={() => setAccent(c.value)}
              className={`w-5 h-5 border-2 cursor-pointer transition-all ${
                currentAccent === c.value
                  ? 'border-text-1 scale-110'
                  : 'border-transparent hover:border-border-bright'
              }`}
              style={{ background: c.value ? `var(--color-${c.value === 'default' ? 'accent' : c.value})` : 'var(--color-accent)' }}
              title={c.label}
            />
          ))}
        </div>
      </div>
    </Section>
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
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-border last:border-0">
      <span className="text-[11px] text-text-2 shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        {badge && (
          <span className={`text-[9px] px-1.5 py-[2px] border shrink-0 ${
            badge === 'active' ? 'border-accent text-accent' : 'border-red text-red'
          }`}>
            {value}
          </span>
        )}
        {!badge && (
          <span className="text-[11px] text-text-1 font-code text-right break-words">{value}</span>
        )}
      </div>
    </div>
  )
}
