import { create } from 'zustand'

export type ViewID = 'chat' | 'stats' | 'settings'
export type AgentID = 'build' | 'plan' | 'compose'

interface UIState {
  activeView: ViewID
  activeAgent: AgentID
  currentModel: string
  sidebarOpen: boolean
  setView: (view: ViewID) => void
  setAgent: (agent: AgentID) => void
  setModel: (model: string) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'chat',
  activeAgent: 'build',
  currentModel: 'mimo-auto',
  sidebarOpen: true,

  setView: (view) => set({ activeView: view }),
  setAgent: (agent) => set({ activeAgent: agent }),
  setModel: (model) => set({ currentModel: model }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
