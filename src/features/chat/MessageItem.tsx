import type { Message } from '../../api/types'
import PartRenderer from './PartRenderer'
import { showContextMenu } from '../../components/ContextMenu'

interface Props {
  message: Message
}

const roleStyles: Record<string, string> = {
  user: 'text-blue bg-blue/10',
  assistant: 'text-accent bg-accent-dim',
  system: 'text-purple bg-purple/10',
}

function formatTime(time: { created: number; completed?: number }): string {
  return new Date(time.created).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
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

export default function MessageItem({ message }: Props) {
  const { info, parts } = message

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const textContent = getTextContent(parts)
    showContextMenu(e.clientX, e.clientY, [
      {
        label: 'Copy text',
        icon: '📋',
        onClick: () => {
          if (textContent) navigator.clipboard.writeText(textContent)
        },
        disabled: !textContent,
      },
      {
        label: 'Copy message ID',
        icon: '⊞',
        onClick: () => navigator.clipboard.writeText(info.id),
      },
      {
        label: 'Copy model',
        icon: '⟡',
        onClick: () => {
          if (info.model) navigator.clipboard.writeText(formatModel(info.model))
        },
        disabled: !info.model,
      },
    ])
  }

  return (
    <div
      className="py-2.5 border-b border-border last:border-0"
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
    </div>
  )
}
