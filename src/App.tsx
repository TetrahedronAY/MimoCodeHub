import { useEffect, useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ConnectionDialog from './components/ConnectionDialog'
import MessageItem from './features/chat/MessageItem'
import MessageInput from './features/chat/MessageInput'
import StatsView from './views/StatsView'
import SettingsView from './views/SettingsView'
import { useConnectionStore } from './store/connection'
import { useSessionStore } from './store/session'
import { useUIStore } from './store/ui'
import { useMessageStore } from './store/message'
import { onSSEEvent } from './api/sse'

export default function App() {
  const { connected } = useConnectionStore()
  const { sessions, currentID, fetchSessions } = useSessionStore()
  const { activeView } = useUIStore()
  const { messages, streaming, fetchMessages } = useMessageStore()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    if (connected) fetchSessions()
  }, [connected, fetchSessions])

  useEffect(() => {
    if (currentID) fetchMessages(currentID)
  }, [currentID, fetchMessages])

  // Auto-scroll when messages update
  const prevMsgCount = useRef(0)
  useEffect(() => {
    const count = currentID ? (messages[currentID]?.length || 0) : 0
    if (count > prevMsgCount.current) scrollToBottom()
    prevMsgCount.current = count
  }, [messages, currentID, scrollToBottom])

  // Auto-scroll during streaming
  useEffect(() => {
    if (currentID && streaming[currentID]) scrollToBottom()
  }, [streaming, currentID, scrollToBottom])

  // SSE: refresh messages & sessions on events
  useEffect(() => {
    return onSSEEvent((event) => {
      if (event.type === 'session.updated' || event.type === 'session.deleted') {
        fetchSessions()
      }
      if (event.type === 'message.updated' || event.type === 'message.part.updated') {
        const sid = useSessionStore.getState().currentID
        if (sid) fetchMessages(sid)
      }
    })
  }, [fetchSessions, fetchMessages])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'k') {
        e.preventDefault()
        useSessionStore.getState().createSession().then(() => {
          useUIStore.getState().setView('chat')
        })
      }
      if (mod && e.key === ',') {
        e.preventDefault()
        useUIStore.getState().setView('settings')
      }
      if (mod && e.key === '4') {
        e.preventDefault()
        useUIStore.getState().setView('stats')
      }
      if (mod && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault()
        const agents = ['build', 'plan', 'compose'] as const
        useUIStore.getState().setAgent(agents[parseInt(e.key) - 1]!)
        useUIStore.getState().setView('chat')
      }
      if (e.key === 'Escape') {
        useUIStore.getState().setView('chat')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const currentSession = sessions.find((s) => s.id === currentID)
  const currentMessages = currentID ? messages[currentID] || [] : []
  const currentStream = currentID ? streaming[currentID] || '' : ''

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-bg-0">
        <Header />

        {activeView === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto py-4">
              {!currentID ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-text-3">
                  <span className="text-2xl opacity-30">⌘</span>
                  <span className="font-ui text-[13px] font-medium">No session selected</span>
                  <span className="text-[10px] opacity-60">Press ⌘K to create a new session</span>
                </div>
              ) : currentMessages.length === 0 && !currentStream ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-text-3">
                  <div className="w-8 h-8 bg-accent flex items-center justify-center font-code text-sm font-bold text-bg-0">M</div>
                  <span className="font-ui text-[13px] font-medium">
                    {currentSession?.title && !currentSession.title.startsWith('New session')
                      ? currentSession.title
                      : 'New Session'}
                  </span>
                  <span className="text-[10px] opacity-60">Send a message to start</span>
                </div>
              ) : (
                <div ref={chatAreaRef} className="max-w-3xl mx-auto px-5">
                  {currentMessages.map((msg, i) => (
                    <MessageItem key={`${msg.info.id}-${i}`} message={msg} />
                  ))}
                  {currentStream && (
                    <div className="py-2.5 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.08em] px-1.5 py-[2px] font-ui text-accent bg-accent-dim">
                          assistant
                        </span>
                      </div>
                      <div className="text-xs text-text-1 leading-relaxed">
                        {currentStream}<span className="streaming-cursor" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
            <MessageInput />
          </div>
        )}

        {activeView === 'stats' && <StatsView />}

        {activeView === 'settings' && <SettingsView />}
      </main>
      <ConnectionDialog />
    </div>
  )
}
