import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import type { Components } from 'react-markdown'

interface Props {
  text: string
}

function CodeBlockPre({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false)

  // Extract code content and language from child <code>
  let code = ''
  let lang = ''
  const child = children as React.ReactElement<{ className?: string; children?: ReactNode }> | undefined
  if (child && typeof child === 'object' && 'props' in child) {
    code = String(child.props.children || '').replace(/\n$/, '')
    lang = child.props.className?.toString().replace('language-', '') || ''
  } else {
    code = String(children || '').replace(/\n$/, '')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Inline code (no language) — render as plain pre > code
  if (!lang) {
    return <pre className="bg-bg-1 border border-border p-3 overflow-x-auto m-0"><code>{children}</code></pre>
  }

  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between px-3 py-1 bg-bg-3 border border-border border-b-0 text-[9px] text-text-3">
        <span>{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 text-text-3 hover:text-text-1 transition-colors bg-transparent border-0 cursor-pointer"
        >
          {copied ? <><Check size={10} className="text-green" /> copied</> : <><Copy size={10} /> copy</>}
        </button>
      </div>
      <pre className="bg-bg-1 border border-border p-3 overflow-x-auto m-0">
        {children}
      </pre>
    </div>
  )
}

const components: Components = {
  pre: CodeBlockPre as Components['pre'],
}

export default function TextPart({ text }: Props) {
  return (
    <div className="text-xs text-text-1 leading-relaxed
      [&_p]:mb-2 [&_p:last-child]:mb-0
      [&_code]:font-code [&_code]:text-[11px] [&_code]:px-1 [&_code]:py-[1px] [&_code]:bg-bg-3 [&_code]:border [&_code]:border-border [&_code]:text-accent
      [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4
      [&_li]:my-0.5
      [&_a]:text-blue [&_a]:underline
      [&_blockquote]:border-l-2 [&_blockquote]:border-border-bright [&_blockquote]:pl-3 [&_blockquote]:text-text-2
      [&_h1]:text-base [&_h1]:font-bold [&_h1]:my-3
      [&_h2]:text-sm [&_h2]:font-bold [&_h2]:my-2
      [&_h3]:text-xs [&_h3]:font-bold [&_h3]:my-2
      [&_table]:my-2 [&_table]:border-collapse [&_table]:w-full
      [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:text-[11px] [&_th]:bg-bg-2
      [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:text-[11px]
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
