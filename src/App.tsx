import { useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ConnectionDialog from './components/ConnectionDialog'
import ContextMenu from './components/ContextMenu'
import UpdateNotification from './components/UpdateNotification'
import MessageItem from './features/chat/MessageItem'
import MessageInput from './features/chat/MessageInput'
import StatsView from './views/StatsView'
import SettingsView from './views/SettingsView'
import { useConnectionStore, MIN_MIMO_VERSION } from './store/connection'
import { useSessionStore } from './store/session'
import { useUIStore } from './store/ui'
import { useMessageStore } from './store/message'
import { onSSEEvent } from './api/sse'

function StreamingMarkdown({ text }: { text: string }) {
  return (
    <>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      <span className="streaming-cursor" />
    </>
  )
}

export default function App() {
  const { connected, versionCompatible, backendVersion, probeResult } = useConnectionStore()
  const { sessions, currentID, fetchSessions } = useSessionStore()
  const { activeView } = useUIStore()
  const { messages, streaming, fetchMessages } = useMessageStore()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatAreaRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  const scrollToBottom = useCallback(() => {
    if (!isAtBottomRef.current) return
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [])

  // Track scroll position
  useEffect(() => {
    const el = chatAreaRef.current
    if (!el) return
    const handleScroll = () => {
      const threshold = 80
      isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [activeView])

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
        {!versionCompatible && backendVersion && (
          <div className="bg-amber/10 border-b border-amber/30 px-4 py-2 text-[11px] text-amber flex items-center gap-2">
            <span>⚠</span>
            <span>MimoCode v{backendVersion} is below the recommended minimum (v{MIN_MIMO_VERSION}). Some features may not work correctly.</span>
          </div>
        )}
        {probeResult && probeResult.compatible === 'degraded' && (
          <div className="bg-amber/10 border-b border-amber/30 px-4 py-2 text-[11px] text-amber flex items-center gap-2">
            <span>⚠</span>
            <span>
              Some API endpoints are not responding correctly.{' '}
              {probeResult.capabilities.filter((c) => c.required && !c.ok).map((c) => c.label).join(', ')} may be unavailable.
            </span>
          </div>
        )}
        {probeResult && probeResult.compatible === 'incompatible' && (
          <div className="bg-red/10 border-b border-red/30 px-4 py-2 text-[11px] text-red flex items-center gap-2">
            <span>✕</span>
            <span>
              Backend is incompatible. Critical API endpoints are not responding. Please update MimoCode CLI.
            </span>
          </div>
        )}

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
                <div className="flex flex-col items-center justify-center h-full gap-5 text-text-3 px-5">
                  <div className="w-10 h-10 bg-accent flex items-center justify-center font-code text-base font-bold text-bg-0">M</div>
                  <span className="font-ui text-[14px] font-medium text-text-2">
                    {currentSession?.title && !currentSession.title.startsWith('New session')
                      ? currentSession.title
                      : '开始对话'}
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-w-[400px] w-full">
                    {[
                      { text: '解释这段代码的作用', icon: '📖' },
                      { text: '帮我调试这个错误', icon: '🔧' },
                      { text: '为这个函数写单元测试', icon: '✅' },
                      { text: '优化这段代码的性能', icon: '⚡' },
                    ].map((item) => (
                      <button
                        key={item.text}
                        onClick={() => {
                          const input = document.querySelector('textarea')
                          if (input) {
                            input.value = item.text
                            input.dispatchEvent(new Event('input', { bubbles: true }))
                            input.focus()
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 bg-bg-2 border border-border text-left text-[11px] text-text-2 cursor-pointer hover:border-border-bright hover:bg-bg-3 transition-colors"
                      >
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
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
                      <div className="text-xs text-text-1 leading-relaxed
                        [&_p]:mb-2 [&_p:last-child]:mb-0
                        [&_code]:font-code [&_code]:text-[11px] [&_code]:px-1 [&_code]:py-[1px] [&_code]:bg-bg-3 [&_code]:border [&_code]:border-border [&_code]:text-accent
                        [&_pre]:bg-bg-1 [&_pre]:border [&_pre]:border-border [&_pre]:p-2.5 [&_pre]:my-2 [&_pre]:overflow-x-auto
                        [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:text-text-2
                        [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4
                        [&_li]:my-0.5
                      ">
                        <StreamingMarkdown text={currentStream} />
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
      <ContextMenu />
      <UpdateNotification />
    </div>
  )
}
