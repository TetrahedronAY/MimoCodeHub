import { create } from 'zustand'
import type { Session } from '../api/types'
import { getSessions, createSession as apiCreateSession } from '../api/client'

interface SessionState {
  sessions: Session[]
  currentID: string | null
  loading: boolean
  fetchSessions: () => Promise<void>
  selectSession: (id: string) => void
  createSession: (directory?: string) => Promise<Session>
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentID: null,
  loading: false,

  fetchSessions: async () => {
    set({ loading: true })
    try {
      const sessions = await getSessions()
      set({ sessions, loading: false })
      if (!get().currentID && sessions.length > 0) {
        set({ currentID: sessions[0]!.id })
      }
    } catch {
      set({ loading: false })
    }
  },

  selectSession: (id: string) => {
    set({ currentID: id })
  },

  createSession: async (directory?: string) => {
    const session = await apiCreateSession(directory)
    set((s) => ({ sessions: [session, ...s.sessions], currentID: session.id }))
    return session
  },
}))
