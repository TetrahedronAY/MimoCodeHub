import { useState } from 'react'
import type { Message } from '../../api/types'
import PartRenderer from './PartRenderer'
import { showContextMenu } from '../../components/ContextMenu'
import { Copy, Check, RotateCcw } from 'lucide-react'

interface Props {
  message: Message
  onRegenerate?: () => void
}

const roleStyles: Record<string, string> = {
  user: 'text-blue bg-blue/10',
  assistant: 'text-accent bg-accent-dim',
  system: 'text-purple bg-purple/10',
}

function formatTime(time: { created: number; completed?: number }): string {
  const d = new Date(time.created)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function formatTokens(tokens?: { input: number; output: number }): string {
  if (!tokens) return ''
  return `↑${tokens.input} ↓${tokens.output}`
}

function formatModel(model?: { providerID: string; modelID: string }): string {
  if (!model) return ''
  return `${model.providerID}/${model.modelID}`
}

function getTextContent(parts: Message['parts']): string {
  return parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join('\n')
}

export default function MessageItem({ message, onRegenerate }: Props) {
  const { info, parts } = message
  const [copied, setCopied] = useState(false)
  const isAssistant = info.role === 'assistant'
  const textContent = getTextContent(parts)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textContent || JSON.stringify(parts, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    showContextMenu(e.clientX, e.clientY, [
      {
        label: 'Copy text',
        icon: '📋',
        onClick: handleCopy,
        disabled: !textContent,
      },
      {
        label: 'Copy message ID',
        icon: '⊞',
        onClick: () => navigator.clipboard.writeText(info.id),
      },
      ...(isAssistant && onRegenerate ? [{
        label: 'Regenerate',
        icon: '↻',
        onClick: onRegenerate,
      }] : []),
    ])
  }

  return (
    <div
      className="group/py-2.5 py-2.5 border-b border-border last:border-0 relative"
      onContextMenu={handleContextMenu}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[9px] font-semibold uppercase tracking-[0.08em] px-1.5 py-[2px] font-ui ${roleStyles[info.role] || roleStyles.system}`}>
          {info.role}
        </span>
        {info.agentID && (
          <span className="text-[9px] text-text-3">{info.agentID}</span>
        )}
        {info.model && (
          <span className="text-[9px] text-text-3 font-code">
            {formatModel(info.model)}
          </span>
        )}
        {info.tokens && (
          <span className="text-[9px] text-text-3 tabular-nums font-code">
            {formatTokens(info.tokens)}
          </span>
        )}
        <span className="ml-auto text-[9px] text-text-3">
          {formatTime(info.time)}
        </span>
      </div>
      <PartRenderer parts={parts} />

      {/* Hover actions */}
      <div className="absolute top-2 right-0 hidden group-hover/py-2.5:flex items-center gap-0.5 opacity-0 group-hover/py-2.5:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1 text-text-3 hover:text-text-1 hover:bg-bg-3 transition-colors bg-transparent border-0 cursor-pointer"
          title="Copy"
        >
          {copied ? <Check size={12} className="text-green" /> : <Copy size={12} />}
        </button>
        {isAssistant && onRegenerate && (
          <button
            onClick={onRegenerate}
            className="p-1 text-text-3 hover:text-text-1 hover:bg-bg-3 transition-colors bg-transparent border-0 cursor-pointer"
            title="Regenerate"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
