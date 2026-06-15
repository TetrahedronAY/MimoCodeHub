import { create } from 'zustand'
import type { Message } from '../api/types'
import { getMessages } from '../api/client'

interface MessageState {
  messages: Record<string, Message[]>
  loading: boolean
  streaming: Record<string, string>
  fetchMessages: (sessionID: string) => Promise<void>
  appendStreamText: (sessionID: string, text: string) => void
  finishStream: (sessionID: string) => void
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},
  loading: false,
  streaming: {},

  fetchMessages: async (sessionID: string) => {
    set({ loading: true })
    try {
      const messages = await getMessages(sessionID)
      set((s) => ({
        messages: { ...s.messages, [sessionID]: messages },
        loading: false,
      }))
    } catch {
      set({ loading: false })
    }
  },

  appendStreamText: (sessionID: string, text: string) => {
    set((s) => ({
      streaming: {
        ...s.streaming,
        [sessionID]: (s.streaming[sessionID] || '') + text,
      },
    }))
  },

  finishStream: (sessionID: string) => {
    set((s) => {
      const { [sessionID]: _, ...rest } = s.streaming
      return { streaming: rest }
    })
  },
}))
