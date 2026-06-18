import type { Artifact, Entry, Page } from '../types'
import { formatDateTime } from './dateUtils'

export function exportJson(pages: Page[], entries: Entry[], artifacts: Artifact[], dailyNotes: Record<string, string> = {}) {
  return JSON.stringify({ exportedAt: new Date().toISOString(), pages, entries, dailyNotes, artifacts }, null, 2)
}

export function exportMarkdown(pages: Page[], entries: Entry[], artifacts: Artifact[], dailyNotes: Record<string, string> = {}) {
  const dailyBlocks = Object.entries(dailyNotes)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, body]) => `## ${date}\n\n${body || '_No note text._'}`)

  const legacyBlocks = pages.map((page) => {
    const pageEntries = entries.filter((entry) => entry.pageId === page.id)
    const notes = pageEntries.map((entry) => {
      const heading = entry.heading ? `### ${entry.heading}\n` : ''
      return `${heading}_${formatDateTime(entry.createdAt)}_\n\n${entry.body}`
    }).join('\n\n')
    return pageEntries.length > 0 ? `## ${page.title}\n\n${notes}` : ''
  }).filter(Boolean)

  const artifactBlocks = artifacts.map((artifact) => `- **${artifact.type}** ${artifact.date ? `[${artifact.date}] ` : ''}${artifact.reminderDate ? `[${artifact.reminderDate}] ` : ''}${artifact.heading ? `${artifact.heading}: ` : ''}${artifact.text}${artifact.completedAt ? ' (done)' : ''}`)
  return `# Magpie Export\n\nExported ${formatDateTime(new Date().toISOString())}\n\n## Daily Notes\n\n${dailyBlocks.join('\n\n') || '_No daily notes yet._'}\n\n${legacyBlocks.join('\n\n')}\n\n## Artifacts\n\n${artifactBlocks.join('\n') || '_No artifacts yet._'}\n`
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}



