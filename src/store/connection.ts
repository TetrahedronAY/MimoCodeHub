import { create } from 'zustand'
import { setBaseURL, getBaseURL, checkConnection } from '../api/client'
import { probeCapabilities, type ProbeResult } from '../api/capabilities'

export const MIN_MIMO_VERSION = '0.1.0'

interface ConnectionState {
  serverURL: string
  connected: boolean
  connecting: boolean
  backendVersion: string
  versionCompatible: boolean
  probeResult: ProbeResult | null
  connect: (url: string) => Promise<void>
  disconnect: () => void
  reconnect: () => Promise<void>
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  serverURL: localStorage.getItem('mimocode-server-url') || 'http://127.0.0.1:4096',
  connected: false,
  connecting: false,
  backendVersion: '',
  versionCompatible: true,
  probeResult: null,

  connect: async (url: string) => {
    set({ connecting: true })
    setBaseURL(url)
    const ok = await checkConnection()
    if (ok) {
      localStorage.setItem('mimocode-server-url', url)
      // Get backend version
      let backendVersion = ''
      try {
        const res = await fetch('/api/check-env')
        if (res.ok) {
          const env = await res.json()
          backendVersion = env.mimoVersion || ''
        }
      } catch { /* production mode */ }
      const compatible = !backendVersion || compareVersions(backendVersion, MIN_MIMO_VERSION) >= 0

      // Run capability probes
      let probeResult: ProbeResult | null = null
      try {
        probeResult = await probeCapabilities()
      } catch { /* ignore probe failures */ }

      set({ serverURL: url, connected: true, connecting: false, backendVersion, versionCompatible: compatible, probeResult })
    } else {
      set({ connected: false, connecting: false })
      throw new Error('Connection failed')
    }
  },

  disconnect: () => {
    set({ connected: false, probeResult: null })
  },

  reconnect: async () => {
    const url = getBaseURL()
    await get().connect(url)
  },
}))
