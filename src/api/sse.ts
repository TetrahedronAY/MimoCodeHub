import type { SSEEvent } from './types'

type EventHandler = (event: SSEEvent) => void

let eventSource: EventSource | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 1000
const MAX_DELAY = 30000
const handlers = new Set<EventHandler>()
let currentURL = ''

export function connectSSE(baseURL: string) {
  disconnectSSE()
  currentURL = baseURL
  reconnectDelay = 1000

  const url = `${baseURL}/event`
  eventSource = new EventSource(url)

  eventSource.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data) as SSEEvent
      handlers.forEach((h) => h(event))
    } catch {
      // malformed event, ignore
    }
  }

  eventSource.onerror = () => {
    eventSource?.close()
    eventSource = null
    scheduleReconnect()
  }
}

export function disconnectSSE() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  eventSource?.close()
  eventSource = null
  currentURL = ''
}

export function onSSEEvent(handler: EventHandler): () => void {
  handlers.add(handler)
  return () => {
    handlers.delete(handler)
  }
}

export function isConnected(): boolean {
  return eventSource?.readyState === EventSource.OPEN
}

function scheduleReconnect() {
  if (!currentURL) return
  reconnectTimer = setTimeout(() => {
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_DELAY)
    connectSSE(currentURL)
  }, reconnectDelay)
}
