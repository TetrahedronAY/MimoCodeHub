import { create } from 'zustand'
import { setBaseURL, getBaseURL, checkConnection } from '../api/client'
import { connectSSE, disconnectSSE } from '../api/sse'

interface ConnectionState {
  serverURL: string
  connected: boolean
  connecting: boolean
  connect: (url: string) => Promise<void>
  disconnect: () => void
  reconnect: () => Promise<void>
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  serverURL: localStorage.getItem('mimocode-server-url') || 'http://127.0.0.1:4096',
  connected: false,
  connecting: false,

  connect: async (url: string) => {
    set({ connecting: true })
    setBaseURL(url)
    const ok = await checkConnection()
    if (ok) {
      localStorage.setItem('mimocode-server-url', url)
      connectSSE(url)
      set({ serverURL: url, connected: true, connecting: false })
    } else {
      disconnectSSE()
      set({ connected: false, connecting: false })
      throw new Error('Connection failed')
    }
  },

  disconnect: () => {
    disconnectSSE()
    set({ connected: false })
  },

  reconnect: async () => {
    const url = getBaseURL()
    await get().connect(url)
  },
}))
