import { useState, useEffect } from 'react'
import { useConnectionStore } from '../store/connection'

declare const __MIMO_PORT__: number | null

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
  const [status, setStatus] = useState<'idle' | 'detecting' | 'connecting'>('idle')

  useEffect(() => {
    if (connected || connecting) return

    const autoConnect = async () => {
      // 1. Try Vite-injected port
      if (__MIMO_PORT__) {
        setStatus('connecting')
        const url = `http://127.0.0.1:${__MIMO_PORT__}`
        setInput(url)
        try {
          await connect(url)
          return
        } catch { /* continue to scan */ }
      }

      // 2. Scan common ports
      setStatus('detecting')
      const port = await scanForServer()
      if (port) {
        const url = `http://127.0.0.1:${port}`
        setInput(url)
        setStatus('connecting')
        try {
          await connect(url)
          return
        } catch { /* fall through */ }
      }

      // 3. Fall back to manual
      setStatus('idle')
      setError('No mimo serve detected. Start it or enter address manually.')
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

  if (connected) return null

  const statusText = status === 'detecting'
    ? 'Scanning for mimo serve...'
    : status === 'connecting'
      ? 'Connecting...'
      : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm">
      <div className="w-[400px] bg-bg-1 border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-accent flex items-center justify-center font-code text-[10px] font-bold text-bg-0">M</div>
          <span className="font-ui text-sm font-bold text-text-1">MimoCode WebUI</span>
        </div>

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
            disabled={connecting}
          />
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-3 py-[6px] bg-accent text-bg-0 font-mono text-xs font-bold cursor-pointer border-0 hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {connecting ? '...' : 'Connect'}
          </button>
        </div>

        {statusText && (
          <p className="mt-2 text-[10px] text-amber">{statusText}</p>
        )}
        {error && (
          <p className="mt-2 text-[10px] text-red">{error}</p>
        )}

        <p className="mt-3 text-[9px] text-text-3 leading-relaxed">
          Auto-detects mimo serve from logs and running processes. Or enter the address manually.
        </p>
      </div>
    </div>
  )
}
