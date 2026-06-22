import { useEffect, useState } from 'react'
import { useConnectionStore, MIN_MIMO_VERSION } from '../store/connection'
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

      {/* Version */}
      <VersionSection />

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
  update,
}: {
  label: React.ReactNode
  value: string
  badge?: 'active' | 'error'
  update?: string
}) {
  return (
    <div className="py-1.5 border-b border-border last:border-0">
      <div className="flex items-center justify-between gap-4">
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
      {update && (
        <div className="mt-1 text-[10px] text-amber">{update}</div>
      )}
    </div>
  )
}

function VersionSection() {
  const [mimo, setMimo] = useState<{ local: string; latest: string; updateAvailable: boolean } | null>(null)
  const [hub, setHub] = useState<{ current: string; latest: string; updateAvailable: boolean } | null>(null)
  const [updating, setUpdating] = useState<'mimo' | 'hub' | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/check-mimo-version').then(r => r.json()).then(setMimo).catch(() => {})
    fetch('/api/check-hub-version').then(r => r.json()).then(setHub).catch(() => {})
  }, [])

  const runUpdate = async (type: 'mimo' | 'hub') => {
    setUpdating(type)
    setLogs([])
    try {
      const res = await fetch(`/api/update-${type}`, { method: 'POST' })
      const reader = res.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.message) setLogs((prev) => [...prev, data.message])
              if (data.ok) {
                if (type === 'mimo') fetch('/api/check-mimo-version').then(r => r.json()).then(setMimo)
                else fetch('/api/check-hub-version').then(r => r.json()).then(setHub)
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch { setLogs(['Update failed']) }
    finally { setUpdating(null) }
  }

  return (
    <Section title="Version">
      {mimo && (
        <div className="py-1.5 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-text-2 shrink-0">MimoCode CLI</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-1 font-code">
                {mimo.local || 'Not installed'}
                <span className="text-[9px] text-text-3 ml-1.5">requires ≥v{MIN_MIMO_VERSION}</span>
              </span>
              {mimo.updateAvailable && (
                <button
                  onClick={() => runUpdate('mimo')}
                  disabled={!!updating}
                  className="text-[9px] px-1.5 py-0.5 bg-amber/20 text-amber border border-amber/30 cursor-pointer font-mono hover:bg-amber/30 disabled:opacity-40"
                >
                  {updating === 'mimo' ? 'Updating...' : `Update to v${mimo.latest}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {hub && (
        <div className="py-1.5 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-text-2 shrink-0">MimoCodeHub</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-1 font-code">
                v{hub.current}
                <span className="text-[9px] text-text-3 ml-1.5">requires MimoCode ≥v{MIN_MIMO_VERSION}</span>
              </span>
              {hub.updateAvailable && (
                <button
                  onClick={() => runUpdate('hub')}
                  disabled={!!updating}
                  className="text-[9px] px-1.5 py-0.5 bg-amber/20 text-amber border border-amber/30 cursor-pointer font-mono hover:bg-amber/30 disabled:opacity-40"
                >
                  {updating === 'hub' ? 'Updating...' : `Update to v${hub.latest}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {logs.length > 0 && (
        <div className="mt-1 bg-bg-2 border border-border p-2 max-h-[60px] overflow-y-auto">
          {logs.map((log, i) => <div key={i} className="text-[9px] text-text-3 font-code">{log}</div>)}
        </div>
      )}
      {!mimo && !hub && <div className="text-[11px] text-text-3 py-1.5">Loading version info...</div>}
    </Section>
  )
}
