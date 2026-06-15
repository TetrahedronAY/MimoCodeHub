import { create } from 'zustand'

export type ViewID = 'chat' | 'stats' | 'settings'
export type AgentID = 'build' | 'plan' | 'compose'

interface UIState {
  activeView: ViewID
  activeAgent: AgentID
  sidebarOpen: boolean
  setView: (view: ViewID) => void
  setAgent: (agent: AgentID) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'chat',
  activeAgent: 'build',
  sidebarOpen: true,

  setView: (view) => set({ activeView: view }),
  setAgent: (agent) => set({ activeAgent: agent }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
