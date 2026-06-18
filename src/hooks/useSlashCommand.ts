import { useMemo, useState } from 'react'

export function useSlashCommand(value: string) {
  const [cursor, setCursor] = useState(0)
  const isOpen = useMemo(() => {
    const beforeCursor = value.slice(0, cursor)
    const currentLine = beforeCursor.split(/\r?\n/).pop() ?? ''
    return /(^|\s)\/[a-z]*$/i.test(currentLine)
  }, [cursor, value])
  return { isOpen, setCursor }
}
