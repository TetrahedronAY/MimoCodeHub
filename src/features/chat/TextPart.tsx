import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  text: string
}

export default function TextPart({ text }: Props) {
  return (
    <div className="text-xs text-text-1 leading-relaxed prose prose-invert max-w-none
      [&_p]:mb-2 [&_p:last-child]:mb-0
      [&_code]:font-code [&_code]:text-[11px] [&_code]:px-1 [&_code]:py-[1px] [&_code]:bg-bg-3 [&_code]:border [&_code]:border-border [&_code]:text-accent
      [&_pre]:bg-bg-1 [&_pre]:border [&_pre]:border-border [&_pre]:p-2.5 [&_pre]:my-2 [&_pre]:overflow-x-auto
      [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:text-text-2
      [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4
      [&_li]:my-0.5
      [&_a]:text-blue [&_a]:underline
      [&_blockquote]:border-l-2 [&_blockquote]:border-border-bright [&_blockquote]:pl-3 [&_blockquote]:text-text-2
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
