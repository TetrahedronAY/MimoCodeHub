import { getBaseURL } from './client'

export interface Capability {
  name: string
  label: string
  ok: boolean
  required: boolean
  detail?: string
}

export interface ProbeResult {
  compatible: 'full' | 'degraded' | 'incompatible'
  capabilities: Capability[]
}

const PROBES: {
  name: string
  label: string
  required: boolean
  check: (base: string) => Promise<{ ok: boolean; detail?: string }>
}[] = [
  {
    name: 'config',
    label: 'Configuration API',
    required: true,
    check: async (base) => {
      try {
        const res = await fetch(`${base}/config`, { signal: AbortSignal.timeout(3000) })
        if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` }
        const data = await res.json()
        if (!data || typeof data !== 'object') return { ok: false, detail: 'Invalid response format' }
        return { ok: true }
      } catch (e) { return { ok: false, detail: String(e) } }
    },
  },
  {
    name: 'sessions',
    label: 'Session API',
    required: true,
    check: async (base) => {
      try {
        const res = await fetch(`${base}/session`, { signal: AbortSignal.timeout(3000) })
        if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` }
        const data = await res.json()
        if (!Array.isArray(data)) return { ok: false, detail: 'Expected array' }
        if (data.length > 0) {
          const s = data[0]
          if (!s.id || !s.title) return { ok: false, detail: 'Missing expected fields (id, title)' }
        }
        return { ok: true }
      } catch (e) { return { ok: false, detail: String(e) } }
    },
  },
  {
    name: 'messages',
    label: 'Message API',
    required: true,
    check: async (base) => {
      try {
        // Get first session to test message endpoint
        const sessRes = await fetch(`${base}/session`, { signal: AbortSignal.timeout(3000) })
        if (!sessRes.ok) return { ok: false, detail: 'Cannot list sessions' }
        const sessions = await sessRes.json()
        if (!sessions.length) return { ok: true } // No sessions to test, assume ok
        const msgRes = await fetch(`${base}/session/${sessions[0].id}/message`, { signal: AbortSignal.timeout(3000) })
        if (!msgRes.ok) return { ok: false, detail: `HTTP ${msgRes.status}` }
        const data = await msgRes.json()
        if (!Array.isArray(data)) return { ok: false, detail: 'Expected array' }
        if (data.length > 0) {
          const m = data[0]
          if (!m.info || !m.parts) return { ok: false, detail: 'Missing expected fields (info, parts)' }
        }
        return { ok: true }
      } catch (e) { return { ok: false, detail: String(e) } }
    },
  },
  {
    name: 'providers',
    label: 'Provider API',
    required: true,
    check: async (base) => {
      try {
        const res = await fetch(`${base}/provider`, { signal: AbortSignal.timeout(3000) })
        if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` }
        const data = await res.json()
        if (!data || typeof data !== 'object') return { ok: false, detail: 'Invalid response' }
        return { ok: true }
      } catch (e) { return { ok: false, detail: String(e) } }
    },
  },
  {
    name: 'agents',
    label: 'Agent API',
    required: false,
    check: async (base) => {
      try {
        const res = await fetch(`${base}/agent`, { signal: AbortSignal.timeout(3000) })
        if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` }
        return { ok: true }
      } catch (e) { return { ok: false, detail: String(e) } }
    },
  },
]

export async function probeCapabilities(): Promise<ProbeResult> {
  const base = getBaseURL()
  const capabilities: Capability[] = []

  for (const probe of PROBES) {
    const result = await probe.check(base)
    capabilities.push({
      name: probe.name,
      label: probe.label,
      ok: result.ok,
      required: probe.required,
      detail: result.detail,
    })
  }

  const requiredFailed = capabilities.filter((c) => c.required && !c.ok)
  const totalRequired = capabilities.filter((c) => c.required).length

  let compatible: ProbeResult['compatible']
  if (requiredFailed.length === 0) compatible = 'full'
  else if (requiredFailed.length < totalRequired) compatible = 'degraded'
  else compatible = 'incompatible'

  return { compatible, capabilities }
}
