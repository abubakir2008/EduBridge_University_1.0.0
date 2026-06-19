'use client'
import React from 'react'

/** Простой markdown-рендер: жирный, курсив, код, маркированные и нумерованные списки, заголовки. */
export function MarkdownMessage({ content }: { content: string }) {
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i}>{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i}>{part.slice(1, -1)}</em>
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i} className="bg-slate-200 rounded px-1 text-[11px] font-mono">{part.slice(1, -1)}</code>
      return part
    })
  }

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let numberedItems: string[] = []

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-0.5 my-1 pl-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-1.5 items-start">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
    if (numberedItems.length) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="space-y-0.5 my-1 pl-1">
          {numberedItems.map((item, i) => (
            <li key={i} className="flex gap-1.5 items-start">
              <span className="text-primary font-medium flex-shrink-0">{i + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      numberedItems = []
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      return
    }

    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(<p key={i} className="font-semibold text-text-primary mt-2 mb-0.5">{renderInline(trimmed.slice(4))}</p>)
      return
    }
    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(<p key={i} className="font-bold text-text-primary mt-2 mb-0.5">{renderInline(trimmed.slice(3))}</p>)
      return
    }

    if (/^[-•*]\s/.test(trimmed)) {
      numberedItems.length && flushList()
      listItems.push(trimmed.replace(/^[-•*]\s/, ''))
      return
    }

    const numMatch = trimmed.match(/^(\d+)\.\s(.+)/)
    if (numMatch) {
      listItems.length && flushList()
      numberedItems.push(numMatch[2])
      return
    }

    flushList()
    elements.push(<p key={i} className="leading-relaxed">{renderInline(trimmed)}</p>)
  })

  flushList()

  return <div className="space-y-1 text-sm">{elements}</div>
}
