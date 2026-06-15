export interface Session {
  id: string
  slug: string
  projectID: string
  directory: string
  title: string
  version: string
  time: { created: number; updated: number }
}

export interface Project {
  id: string
  worktree: string
  vcs: string
  name: string
  time: { created: number; updated: number }
  sandboxes: unknown[]
}

export interface MessageInfo {
  role: 'user' | 'assistant' | 'system'
  id: string
  sessionID: string
  agentID?: string
  time: { created: number; completed?: number }
  model?: { providerID: string; modelID: string }
  tokens?: {
    input: number
    output: number
    reasoning?: number
    cache?: { read: number; write: number }
  }
  cost?: number
}

export interface TextPart {
  type: 'text'
  text: string
  id?: string
}

export interface ReasoningPart {
  type: 'reasoning'
  text: string
  time?: { start: number; end: number }
  id?: string
}

export interface ToolPart {
  type: 'tool'
  callID: string
  tool: string
  state: {
    status: 'running' | 'completed' | 'error'
    input?: Record<string, unknown>
    output?: string
  }
  id?: string
}

export type Part = TextPart | ReasoningPart | ToolPart

export interface Message {
  info: MessageInfo
  parts: Part[]
}

export interface Provider {
  id: string
  name: string
  models: Model[]
}

export interface Model {
  id: string
  name: string
  contextWindow?: number
  maxOutput?: number
  capabilities?: string[]
}

export interface Agent {
  id: string
  name: string
  color: string
  description?: string
  primary?: boolean
}

export interface Config {
  agents: Agent[]
  providers: Provider[]
  username?: string
}

export type SSEEvent =
  | { type: 'session.updated'; data: Session }
  | { type: 'session.deleted'; data: { id: string } }
  | { type: 'message.updated'; data: Message }
  | { type: 'message.part.updated'; data: Part & { messageID: string } }
  | { type: 'message.part.removed'; data: { id: string } }
  | { type: string; data: unknown }
