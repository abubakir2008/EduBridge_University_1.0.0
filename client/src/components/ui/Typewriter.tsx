'use client'
import { useEffect, useRef, useState } from 'react'

interface TypewriterProps {
  text: string
  speed?: number        // мс на один «тик»
  chunk?: number        // сколько символов за тик
  onDone?: () => void
  className?: string
}

/**
 * Эффект печатной машинки: текст появляется по чуть-чуть, будто кто-то печатает.
 * Клик по тексту мгновенно показывает всё целиком.
 */
export function Typewriter({ text, speed = 18, chunk = 2, onDone, className }: TypewriterProps) {
  const [count, setCount] = useState(0)
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    setCount(0)
    doneRef.current = false
  }, [text])

  useEffect(() => {
    if (count >= text.length) {
      if (!doneRef.current) {
        doneRef.current = true
        onDoneRef.current?.()
      }
      return
    }
    const t = setTimeout(() => setCount((c) => Math.min(text.length, c + chunk)), speed)
    return () => clearTimeout(t)
  }, [count, text, speed, chunk])

  const revealAll = () => setCount(text.length)
  const visible = text.slice(0, count)
  const typing = count < text.length

  return (
    <span className={className} onClick={revealAll}>
      {visible}
      {typing && <span className="inline-block w-[2px] h-[1em] -mb-[2px] bg-current animate-pulse ml-0.5" />}
    </span>
  )
}
