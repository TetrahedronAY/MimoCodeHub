import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface ContextMenuItem {
  label: string
  icon?: string
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}

interface ContextMenuState {
  x: number
  y: number
  items: ContextMenuItem[]
}

let globalSetMenu: ((state: ContextMenuState | null) => void) | null = null

export function showContextMenu(x: number, y: number, items: ContextMenuItem[]) {
  // Adjust position to stay within viewport
  const adjusted = { x: Math.min(x, window.innerWidth - 200), y: Math.min(y, window.innerHeight - items.length * 30 - 10) }
  globalSetMenu?.({ ...adjusted, items })
}

export default function ContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    globalSetMenu = setMenu
    return () => { globalSetMenu = null }
  }, [])

  // Close on click outside or Escape
  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [menu])

  if (!menu) return null

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[10000] min-w-[160px] bg-bg-1 border border-border shadow-xl py-0.5"
      style={{ left: menu.x, top: menu.y }}
    >
      {menu.items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); setMenu(null) }}
          disabled={item.disabled}
          className={`w-full text-left flex items-center gap-2 px-3 py-[5px] text-[11px] font-mono cursor-pointer transition-colors border-0 bg-transparent ${
            item.danger
              ? 'text-red hover:bg-red/10'
              : item.disabled
                ? 'text-text-3 cursor-not-allowed'
                : 'text-text-1 hover:bg-bg-2'
          }`}
        >
          {item.icon && <span className="w-4 text-center text-[10px]">{item.icon}</span>}
          <span className="flex-1">{item.label}</span>
          {item.shortcut && <span className="text-[9px] text-text-3 ml-2">{item.shortcut}</span>}
        </button>
      ))}
    </div>,
    document.body,
  )
}
