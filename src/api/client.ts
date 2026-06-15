import type { Session, Message, Provider, Config, Agent, Project } from './types'

let baseURL = 'http://127.0.0.1:4096'

export function setBaseURL(url: string) {
  baseURL = url.replace(/\/+$/, '')
}

export function getBaseURL() {
  return baseURL
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseURL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function checkConnection(): Promise<boolean> {
  try {
    await request<Config>('/config')
    return true
  } catch {
    return false
  }
}

export async function getProjects(): Promise<Project[]> {
  return request<Project[]>('/project')
}

export async function getSessions(): Promise<Session[]> {
  return request<Session[]>('/session')
}

export async function getSession(id: string): Promise<Session> {
  return request<Session>(`/session/${id}`)
}

export async function createSession(directory?: string): Promise<Session> {
  return request<Session>('/session', {
    method: 'POST',
    body: JSON.stringify(directory ? { directory } : {}),
  })
}

export async function getMessages(sessionID: string): Promise<Message[]> {
  return request<Message[]>(`/session/${sessionID}/message`)
}

export async function getProviders(): Promise<Provider[]> {
  return request<Provider[]>('/provider')
}

export async function getConfig(): Promise<Config> {
  return request<Config>('/config')
}

export async function getAgents(): Promise<Agent[]> {
  return request<Agent[]>('/agent')
}

export async function getMcpServers(): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>('/mcp')
}
