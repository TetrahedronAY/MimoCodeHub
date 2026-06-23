import { useState, useEffect } from 'react'
import { X, ShieldCheck } from 'lucide-react'
import { useConnectionStore } from '../store/connection'

interface VersionInfo {
  mimoLocal: string
  mimoLatest: string
  mimoUpdate: boolean
  hubCurrent: string
  hubLatest: string
  hubUpdate: boolean
}

export default function UpdateNotification() {
  const [info, setInfo] = useState<VersionInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState<'mimo' | 'hub' | null>(null)
  const { probeResult } = useConnectionStore()

  useEffect(() => {
    const check = async () => {
      try {
        const [mimoRes, hubRes] = await Promise.all([
          fetch('/api/check-mimo-version').then(r => r.json()).catch(() => ({})),
          fetch('/api/check-hub-version').then(r => r.json()).catch(() => ({})),
        ])

        const mimoUpdate = mimoRes.updateAvailable || false
        const hubUpdate = hubRes.updateAvailable || false

        if (mimoUpdate || hubUpdate) {
          setInfo({
            mimoLocal: mimoRes.local || '',
            mimoLatest: mimoRes.latest || '',
            mimoUpdate,
            hubCurrent: hubRes.current || '',
            hubLatest: hubRes.latest || '',
            hubUpdate,
          })
        }
      } catch { /* ignore */ }
    }
    check()
  }, [])

  const runUpdate = async (type: 'mimo' | 'hub') => {
    setUpdating(type)
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
              if (data.ok) {
                setInfo(null)
                window.location.reload()
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch { /* ignore */ }
    finally { setUpdating(null) }
  }

  if (!info || dismissed) return null

  // Determine if mimo update is safe based on probe results
  const mimoSafe = !probeResult || probeResult.compatible === 'full'
  const mimoDegraded = probeResult && probeResult.compatible === 'degraded'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-0/60 backdrop-blur-sm">
      <div className="w-[420px] bg-bg-1 border border-border p-5 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-text-3 hover:text-text-1 bg-transparent border-0 cursor-pointer"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 bg-amber flex items-center justify-center text-bg-0 text-[10px] font-bold">↑</div>
          <span className="font-ui text-sm font-bold text-text-1">Update Available</span>
        </div>

        {/* MimoCode CLI update */}
        {info.mimoUpdate && (
          <div className="mb-3 p-2.5 bg-bg-2 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-2">MimoCode CLI</span>
              <span className="text-[11px] font-code text-text-1">
                v{info.mimoLocal} → <span className="text-accent">v{info.mimoLatest}</span>
              </span>
            </div>
            {mimoSafe && (
              <div className="mt-1.5 flex items-center gap-1 text-[9px] text-green">
                <ShieldCheck size={10} />
                <span>Passed compatibility checks — safe to update</span>
              </div>
            )}
            {mimoDegraded && (
              <div className="mt-1.5 text-[9px] text-amber">
                Some API endpoints may be affected. Update recommended after updating MimoCodeHub.
              </div>
            )}
            <button
              onClick={() => runUpdate('mimo')}
              disabled={!!updating}
              className="mt-2 w-full py-1.5 bg-accent text-bg-0 text-[11px] font-mono font-bold border-0 cursor-pointer hover:opacity-85 disabled:opacity-40"
            >
              {updating === 'mimo' ? 'Updating...' : 'Update MimoCode CLI'}
            </button>
          </div>
        )}

        {/* Hub update */}
        {info.hubUpdate && (
          <div className="mb-3 p-2.5 bg-bg-2 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-2">MimoCodeHub</span>
              <span className="text-[11px] font-code text-text-1">
                v{info.hubCurrent} → <span className="text-accent">v{info.hubLatest}</span>
              </span>
            </div>
            <button
              onClick={() => runUpdate('hub')}
              disabled={!!updating}
              className="mt-2 w-full py-1.5 bg-accent text-bg-0 text-[11px] font-mono font-bold border-0 cursor-pointer hover:opacity-85 disabled:opacity-40"
            >
              {updating === 'hub' ? 'Updating...' : 'Update MimoCodeHub'}
            </button>
          </div>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="w-full py-1.5 bg-transparent border border-border text-text-3 text-[10px] font-mono cursor-pointer hover:bg-bg-2 hover:text-text-2"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
