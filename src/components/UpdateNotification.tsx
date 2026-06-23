import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

// Maximum MimoCode CLI version supported by each MimoCodeHub version
// When updating MimoCodeHub, bump this value to match the new compatibility range
const HUB_MAX_MIMO_VERSION: Record<string, string> = {
  '0.5.0': '0.1.2',
  '0.4.3': '0.1.2',
  '0.4.2': '0.1.2',
  '0.4.1': '0.1.2',
  '0.4.0': '0.1.2',
  '0.3.2': '0.1.1',
  '0.3.1': '0.1.1',
  '0.3.0': '0.1.1',
  '0.2.1': '0.1.1',
  '0.2.0': '0.1.1',
  '0.1.1': '0.1.0',
  '0.1.0': '0.1.0',
}

function isMimoCompatible(hubVersion: string, mimoVersion: string): boolean {
  const maxSupported = HUB_MAX_MIMO_VERSION[hubVersion]
  if (!maxSupported) return true // unknown hub version, allow
  const [a, b, c] = mimoVersion.split('.').map(Number)
  const [x, y, z] = maxSupported.split('.').map(Number)
  if (a! > x!) return false
  if (a! < x!) return true
  if (b! > y!) return false
  if (b! < y!) return true
  return (c || 0) <= (z || 0)
}

interface VersionInfo {
  mimoLocal: string
  mimoLatest: string
  mimoUpdate: boolean
  mimoCompatible: boolean
  hubCurrent: string
  hubLatest: string
  hubUpdate: boolean
}

export default function UpdateNotification() {
  const [info, setInfo] = useState<VersionInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState<'mimo' | 'hub' | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const [mimoRes, hubRes] = await Promise.all([
          fetch('/api/check-mimo-version').then(r => r.json()).catch(() => ({})),
          fetch('/api/check-hub-version').then(r => r.json()).catch(() => ({})),
        ])
        const hubVersion = hubRes.current || '0.0.0'
        const mimoLatest = mimoRes.latest || ''
        const mimoCompatible = isMimoCompatible(hubVersion, mimoLatest)

        // Only show mimo update if compatible with current hub version
        const mimoUpdate = mimoRes.updateAvailable && mimoCompatible
        const hasUpdate = mimoUpdate || hubRes.updateAvailable

        if (hasUpdate) {
          setInfo({
            mimoLocal: mimoRes.local || '',
            mimoLatest,
            mimoUpdate,
            mimoCompatible,
            hubCurrent: hubVersion,
            hubLatest: hubRes.latest || '',
            hubUpdate: hubRes.updateAvailable || false,
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-0/60 backdrop-blur-sm">
      <div className="w-[400px] bg-bg-1 border border-border p-5 relative">
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

        {info.mimoUpdate && (
          <div className="mb-3 p-2.5 bg-bg-2 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-2">MimoCode CLI</span>
              <span className="text-[11px] font-code text-text-1">
                v{info.mimoLocal} → <span className="text-accent">v{info.mimoLatest}</span>
              </span>
            </div>
            <button
              onClick={() => runUpdate('mimo')}
              disabled={!!updating}
              className="mt-2 w-full py-1.5 bg-accent text-bg-0 text-[11px] font-mono font-bold border-0 cursor-pointer hover:opacity-85 disabled:opacity-40"
            >
              {updating === 'mimo' ? 'Updating...' : 'Update MimoCode CLI'}
            </button>
          </div>
        )}

        {/* Show warning if mimo has update but hub doesn't support it yet */}
        {!info.mimoUpdate && info.hubUpdate && (
          <div className="mb-3 p-2.5 bg-bg-2 border border-amber/30">
            <div className="text-[10px] text-amber mb-1">
              MimoCode CLI v{info.mimoLatest} is available but requires MimoCodeHub update first.
            </div>
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

        {/* Only show hub update if mimo is already compatible */}
        {info.hubUpdate && info.mimoUpdate && (
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
