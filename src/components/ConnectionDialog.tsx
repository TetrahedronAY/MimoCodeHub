import { useState, useEffect } from 'react'
import { useConnectionStore } from '../store/connection'

export default function ConnectionDialog() {
  const { connected, connecting, serverURL, connect } = useConnectionStore()
  const [input, setInput] = useState(serverURL)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!connected && !connecting) {
      connect(input).catch(() => setError('Cannot reach server'))
    }
  }, [])

  const handleConnect = async () => {
    setError('')
    try {
      await connect(input)
    } catch {
      setError('Cannot reach server')
    }
  }

  if (connected) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm">
      <div className="w-[380px] bg-bg-1 border border-border p-5">
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

        {error && (
          <p className="mt-2 text-[10px] text-red">{error}</p>
        )}

        <p className="mt-3 text-[9px] text-text-3">
          Start <code className="px-1 py-[1px] bg-bg-3 border border-border text-accent text-[10px]">mimo serve</code> first, then enter the server address above.
        </p>
      </div>
    </div>
  )
}
