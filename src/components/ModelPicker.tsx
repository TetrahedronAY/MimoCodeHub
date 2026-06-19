import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useConnectionStore } from '../store/connection'
import { useSessionStore } from '../store/session'
import { getProviders } from '../api/client'

interface ModelInfo {
  providerID: string
  providerName: string
  modelID: string
  modelName: string
}

export default function ModelPicker() {
  const [open, setOpen] = useState(false)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [current, setCurrent] = useState('mimo-auto')
  const ref = useRef<HTMLDivElement>(null)
  const { connected } = useConnectionStore()
  const { currentID } = useSessionStore()

  useEffect(() => {
    if (!connected) return
    getProviders().then((data) => {
      const connectedProviders = new Set(data.connected || [])
      const result: ModelInfo[] = []
      for (const p of data.all || []) {
        if (!connectedProviders.has(p.id)) continue
        const modelList = Array.isArray(p.models) ? p.models : Object.keys(p.models || {}).map((id) => ({ id, name: id }))
        for (const m of modelList) {
          result.push({
            providerID: p.id,
            providerName: p.name || p.id,
            modelID: m.id,
            modelName: m.name || m.id,
          })
        }
      }
      setModels(result)
    }).catch(() => {})
  }, [connected])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = async (model: ModelInfo) => {
    const fullID = `${model.providerID}/${model.modelID}`
    setCurrent(model.modelID)
    setOpen(false)

    // Update session model via PATCH
    if (currentID) {
      try {
        const base = useConnectionStore.getState().serverURL
        await fetch(`${base}/session/${currentID}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: fullID }),
        })
      } catch { /* ignore */ }
    }
  }

  const currentModel = models.find((m) => m.modelID === current)
  const displayLabel = currentModel
    ? `${currentModel.modelName}`
    : current

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-1.5 py-[2px] bg-bg-3 border border-border text-text-2 text-[9px] font-medium font-code flex items-center gap-1 cursor-pointer hover:border-border-bright transition-colors"
      >
        {displayLabel}
        <ChevronDown size={8} className={`text-text-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-[280px] bg-bg-1 border border-border shadow-lg z-50 max-h-[300px] overflow-y-auto">
          <div className="px-2 py-1.5 text-[9px] uppercase tracking-[0.08em] text-text-3 font-semibold border-b border-border">
            Model
          </div>
          {models.length === 0 ? (
            <div className="px-3 py-3 text-[10px] text-text-3">Loading models...</div>
          ) : (
            models.map((m) => (
              <button
                key={`${m.providerID}/${m.modelID}`}
                onClick={() => handleSelect(m)}
                className={`w-full text-left flex items-center gap-2 px-3 py-[5px] text-[11px] cursor-pointer transition-colors border-0 bg-transparent ${
                  m.modelID === current
                    ? 'text-accent bg-accent-dim'
                    : 'text-text-1 hover:bg-bg-2'
                }`}
              >
                {m.modelID === current && <Check size={10} className="text-accent shrink-0" />}
                <span className={m.modelID !== current ? 'ml-[18px]' : ''}>
                  <span className="font-medium">{m.modelName}</span>
                  <span className="ml-1.5 text-[9px] text-text-3">{m.providerName}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
