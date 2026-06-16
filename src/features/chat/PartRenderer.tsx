import type { Part } from '../../api/types'
import TextPart from './TextPart'
import ReasoningPart from './ReasoningPart'
import ToolCallPart from './ToolCallPart'

interface Props {
  parts: Part[]
}

export default function PartRenderer({ parts }: Props) {
  return (
    <>
      {parts.map((part, i) => {
        switch (part.type) {
          case 'text':
            return <TextPart key={i} text={part.text} />
          case 'reasoning':
            return <ReasoningPart key={i} text={part.text} time={part.time} />
          case 'tool':
            return <ToolCallPart key={i} {...part} />
          default:
            return null
        }
      })}
    </>
  )
}
