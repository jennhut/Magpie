import type { ArtifactType, TaggedLine } from '../types'

export const artifactTypes: ArtifactType[] = ['action', 'event', 'decision', 'question', 'risk', 'reminder']

const slashPattern = /(?:^|\s)\/(action|event|decision|question|risk|reminder)\b\s*(.*)$/i
const leadingSlashPattern = /^\s*\/(action|event|decision|question|risk|reminder)\b\s*(.*)$/i
const headingPattern = /^\s*#{1,6}\s+(.+)$/
const isoDatePattern = /^(\d{4}-\d{2}-\d{2})\s+(.+)$/
const compactDatePattern = /^(\d{2})(\d{2})(\d{2})\s+(.+)$/

function extractDate(text: string) {
  const isoMatch = text.match(isoDatePattern)
  if (isoMatch) return { date: isoMatch[1], text: isoMatch[2].trim() }

  const compactMatch = text.match(compactDatePattern)
  if (!compactMatch) return { text }

  const day = compactMatch[1]
  const month = compactMatch[2]
  const year = Number(compactMatch[3])
  const fullYear = year >= 70 ? 1900 + year : 2000 + year
  const date = `${fullYear}-${month}-${day}`
  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== fullYear || parsed.getMonth() + 1 !== Number(month) || parsed.getDate() !== Number(day)) {
    return { text }
  }

  return { date, text: compactMatch[4].trim() }
}

export function parseTaggedLines(body: string, createdAt = new Date().toISOString()): TaggedLine[] {
  let currentHeading: string | undefined
  return body
    .split(/\r?\n/)
    .flatMap((line) => {
      const headingMatch = line.match(headingPattern)
      if (headingMatch) {
        currentHeading = headingMatch[1].trim()
        return []
      }

      const match = line.match(slashPattern)
      if (!match) return []

      const type = match[1].toLowerCase() as ArtifactType
      let text = match[2].trim()
      let reminderDate: string | undefined
      let date: string | undefined
      if (type === 'reminder' || type === 'action' || type === 'event') {
        const parsed = extractDate(text)
        if (parsed.date) {
          if (type === 'reminder') reminderDate = parsed.date
          else date = parsed.date
          text = parsed.text
        }
      }

      return [{ id: crypto.randomUUID(), entryId: '', type, text: text || type, createdAt, reminderDate, date, heading: currentHeading }]
    })
}

export function cleanTaggedLine(line: string) {
  const match = line.match(leadingSlashPattern)
  return match ? match[2].trim() : line
}

export function lineType(line: string): ArtifactType | undefined {
  return line.match(leadingSlashPattern)?.[1].toLowerCase() as ArtifactType | undefined
}
