import { useState, useRef, useCallback, useEffect } from 'react'
import { useConnectionStore } from '../../store/connection'
import { useSessionStore } from '../../store/session'
import { useMessageStore } from '../../store/message'
import { useUIStore } from '../../store/ui'
import ModelPicker from '../../components/ModelPicker'

export default function MessageInput() {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { connected } = useConnectionStore()
  const { currentID } = useSessionStore()
  const { activeAgent } = useUIStore()

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [])

  const handleSend = useCallback(async () => {
    if (!text.trim() || !currentID || sending || !connected) return
    const msg = text.trim()
    setText('')
    setError('')
    setSending(true)
    textareaRef.current?.focus()

    try {
      const base = useConnectionStore.getState().serverURL
      const res = await fetch(`${base}/session/${currentID}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts: [{ type: 'text', text: msg }] }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      // Clear any existing polling
      if (pollRef.current) clearInterval(pollRef.current)

      // Poll for new messages after sending
      pollRef.current = setInterval(async () => {
        try {
          const msgRes = await fetch(`${base}/session/${currentID}/message`)
          if (msgRes.ok) {
            const messages = await msgRes.json()
            useMessageStore.setState((s) => ({
              messages: { ...s.messages, [currentID!]: messages },
            }))
          }
        } catch {
          // ignore poll errors
        }
      }, 1000)

      // Stop polling after 30 seconds
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      }, 30000)
    } catch (err) {
      // Restore input on failure so user doesn't lose their message
      setText(msg)
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }, [text, currentID, sending, connected, activeAgent])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-bg-1 px-5 py-2.5">
      <div className="flex items-center gap-2 mb-1.5">
        <ModelPicker />
        <span className="w-px h-3 bg-border" />
        <span className="px-1.5 py-[2px] bg-bg-3 border border-border text-text-2 text-[9px] font-medium flex items-center gap-1">
          <span className={`w-[5px] h-[5px] rounded-full ${
            activeAgent === 'build' ? 'bg-agent-build'
              : activeAgent === 'plan' ? 'bg-agent-plan'
                : 'bg-agent-compose'
          }`} />
          {activeAgent}
        </span>
      </div>
      {error && (
        <div className="mb-1.5 px-2 py-1 bg-red/10 border border-red/30 text-red text-[10px]">
          {error}
        </div>
      )}
      <div className="flex items-end gap-2 border border-border bg-bg-2 px-2.5 py-2 focus-within:border-accent focus-within:shadow-[0_0_0_1px_rgba(180,240,78,0.2)] transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); setError(''); autoResize() }}
          onKeyDown={handleKeyDown}
          placeholder={connected ? 'Send a message...' : 'Connect to server first...'}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none text-text-1 font-mono text-xs leading-normal resize-none min-h-[20px] max-h-[120px] placeholder:text-text-3"
          disabled={!connected || sending}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || !connected || sending}
          className="w-7 h-7 flex items-center justify-center bg-accent text-bg-0 border-0 cursor-pointer text-[13px] font-bold hover:opacity-85 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          {sending ? '...' : '↑'}
        </button>
      </div>
      <div className="flex items-center gap-2.5 mt-1.5 text-[9px] text-text-3">
        <span><kbd className="text-[8px] px-[3px] bg-bg-3 border border-border">Enter</kbd> send</span>
        <span><kbd className="text-[8px] px-[3px] bg-bg-3 border border-border">Shift+Enter</kbd> newline</span>
        <span><kbd className="text-[8px] px-[3px] bg-bg-3 border border-border">⌘K</kbd> new session</span>
      </div>
    </div>
  )
}
