import { useState, useEffect } from 'react'
import { useConnectionStore } from '../store/connection'
import { Play, Loader2, Check, X } from 'lucide-react'

declare const __MIMO_PORT__: number | null

interface EnvStatus {
  node: string
  mimo: string
  mimoVersion: string
  serveRunning: boolean
}

async function scanForServer(): Promise<number | null> {
  const ports = [4096, 19880, 3000, 8080, 9000]
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/config`, {
        signal: AbortSignal.timeout(500),
      })
      if (res.ok) return port
    } catch { /* not available */ }
  }
  return null
}

export default function ConnectionDialog() {
  const { connected, connecting, serverURL, connect } = useConnectionStore()
  const [input, setInput] = useState(serverURL)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'detecting' | 'connecting' | 'starting'>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [env, setEnv] = useState<EnvStatus | null>(null)
  const [installing, setInstalling] = useState(false)

  // Auto-detect environment and connect
  useEffect(() => {
    if (connected || connecting) return

    const autoConnect = async () => {
      // 1. Check environment
      try {
        const res = await fetch('/api/check-env')
        if (res.ok) setEnv(await res.json())
      } catch { /* Vite plugin not available (production) */ }

      // 2. Try Vite-injected port
      if (__MIMO_PORT__) {
        setStatus('connecting')
        const url = `http://127.0.0.1:${__MIMO_PORT__}`
        setInput(url)
        try { await connect(url); return } catch { /* continue */ }
      }

      // 3. Scan common ports
      setStatus('detecting')
      const port = await scanForServer()
      if (port) {
        const url = `http://127.0.0.1:${port}`
        setInput(url)
        setStatus('connecting')
        try { await connect(url); return } catch { /* fall through */ }
      }

      setStatus('idle')
    }

    autoConnect()
  }, [])

  const handleConnect = async () => {
    setError('')
    setStatus('connecting')
    try {
      await connect(input)
    } catch {
      setError('Cannot reach server')
      setStatus('idle')
    }
  }

  const handleStartServer = async () => {
    setError('')
    setStatus('starting')
    setLogs([])
    try {
      const res = await fetch('/api/start-server', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start')
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')
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
              if (data.ok && data.port) {
                const url = `http://127.0.0.1:${data.port}`
                setInput(url)
                setStatus('connecting')
                await new Promise((r) => setTimeout(r, 1000))
                try { await connect(url); return } catch {
                  setError('Server started but connection failed')
                  setStatus('idle')
                }
              }
              if (data.error) { setError(data.error); setStatus('idle') }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start server')
      setStatus('idle')
    }
  }

  const handleInstall = async () => {
    setInstalling(true)
    setError('')
    setLogs(['Installing @mimo-ai/cli...'])
    try {
      const res = await fetch('/api/install-mimo', { method: 'POST' })
      if (!res.ok) throw new Error('Install endpoint not available')
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')
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
                // Re-check environment
                const envRes = await fetch('/api/check-env')
                if (envRes.ok) setEnv(await envRes.json())
              }
              if (data.error) setError(data.error)
            } catch { /* ignore */ }
          }
        }
      }
    } catch {
      setLogs((prev) => [...prev, 'Install requires a running dev server (npm run dev)'])
    } finally {
      setInstalling(false)
    }
  }

  if (connected) return null
  const isBusy = status === 'detecting' || status === 'connecting' || status === 'starting'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm">
      <div className="w-[440px] bg-bg-1 border border-border p-5">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-accent flex items-center justify-center font-code text-[10px] font-bold text-bg-0">M</div>
          <span className="font-ui text-sm font-bold text-text-1">MimoCodeHub</span>
        </div>

        {/* Environment status */}
        {env && (
          <div className="mb-4 p-2.5 bg-bg-2 border border-border">
            <div className="text-[9px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-2">Environment</div>
            <div className="flex flex-col gap-1.5">
              <EnvRow label="Node.js" ok={!!env.node} value={env.node || 'Not found'} />
              <EnvRow
                label="MimoCode CLI"
                ok={!!env.mimo}
                value={env.mimoVersion || (env.mimo ? 'Installed' : 'Not found')}
                action={!env.mimo ? (
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className="text-[9px] px-1.5 py-0.5 bg-accent text-bg-0 border-0 cursor-pointer font-mono hover:opacity-85 disabled:opacity-40"
                  >
                    {installing ? '...' : 'Install'}
                  </button>
                ) : undefined}
              />
              <EnvRow label="mimo serve" ok={env.serveRunning} value={env.serveRunning ? 'Running' : 'Not running'} />
            </div>
          </div>
        )}

        {/* Server address */}
        <label className="block text-[9px] uppercase tracking-[0.08em] text-text-3 font-medium mb-1.5">
          Server Address
        </label>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            placeholder="http://127.0.0.1:4096"
            className="flex-1 px-2.5 py-[6px] bg-bg-2 border border-border text-text-1 font-mono text-xs outline-none focus:border-accent focus:shadow-[0_0_0_1px_rgba(180,240,78,0.2)] transition-colors placeholder:text-text-3"
            disabled={isBusy}
          />
          <button
            onClick={handleConnect}
            disabled={isBusy || !input.trim()}
            className="px-3 py-[6px] bg-accent text-bg-0 font-mono text-xs font-bold cursor-pointer border-0 hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {status === 'connecting' ? '...' : 'Connect'}
          </button>
        </div>

        {status === 'detecting' && <p className="mt-2 text-[10px] text-amber">Scanning for mimo serve...</p>}
        {status === 'starting' && (
          <p className="mt-2 text-[10px] text-amber flex items-center gap-1">
            <Loader2 size={10} className="animate-spin" /> Starting mimo serve...
          </p>
        )}
        {error && <p className="mt-2 text-[10px] text-red">{error}</p>}

        {logs.length > 0 && (
          <div className="mt-2 bg-bg-2 border border-border p-2 max-h-[80px] overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="text-[9px] text-text-3 font-code leading-relaxed">{log}</div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[9px] text-text-3">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Start server */}
        <button
          onClick={handleStartServer}
          disabled={isBusy}
          className="w-full py-2 flex items-center justify-center gap-2 border border-border-bright bg-bg-2 text-text-2 text-[11px] font-mono cursor-pointer hover:bg-bg-3 hover:text-text-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === 'starting' ? <Loader2 size={12} className="animate-spin" /> : <Play size={10} />}
          Start mimo serve
        </button>

        <p className="mt-3 text-[9px] text-text-3 leading-relaxed">
          Auto-detects running instances. Or start a new server directly.
        </p>
      </div>
    </div>
  )
}

function EnvRow({ label, ok, value, action }: { label: string; ok: boolean; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      {ok ? <Check size={10} className="text-green shrink-0" /> : <X size={10} className="text-red shrink-0" />}
      <span className="text-text-2">{label}</span>
      <span className="text-text-3 font-code text-[10px]">{value}</span>
      {action && <span className="ml-auto">{action}</span>}
    </div>
  )
}
