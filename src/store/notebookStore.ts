import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Entry, Page, TaggedLine } from '../types'
import { idbStorage } from './idbStorage'

interface AddEntryInput {
  pageId: string
  heading?: string
  body: string
  taggedLines: TaggedLine[]
}

interface NotebookState {
  pages: Page[]
  entries: Entry[]
  dailyNotes: Record<string, string>
  activePageId: string
  addPage: (title?: string) => Page
  selectPage: (id: string) => void
  addEntry: (input: AddEntryInput) => Entry
  updateDailyNote: (key: string, body: string) => void
  mergeNotebook: (pages: Page[], entries: Entry[], dailyNotes: Record<string, string>) => void
}

const makeId = () => crypto.randomUUID()
const now = () => new Date().toISOString()
const defaultPage: Page = { id: 'inbox', title: 'Inbox', createdAt: now() }

export const useNotebookStore = create<NotebookState>()(
  persist(
    (set, get) => ({
      pages: [defaultPage],
      entries: [],
      dailyNotes: {},
      activePageId: defaultPage.id,
      addPage: (title) => {
        const page: Page = {
          id: makeId(),
          title: title?.trim() || `Page ${get().pages.length + 1}`,
          createdAt: now()
        }
        set((state) => ({ pages: [...state.pages, page], activePageId: page.id }))
        return page
      },
      selectPage: (id) => set({ activePageId: id }),
      addEntry: (input) => {
        const entry: Entry = {
          id: makeId(),
          pageId: input.pageId,
          heading: input.heading?.trim() || undefined,
          body: input.body.trim(),
          createdAt: now(),
          taggedLines: input.taggedLines.map((line) => ({ ...line, entryId: line.entryId || '' }))
        }
        entry.taggedLines = entry.taggedLines.map((line) => ({ ...line, entryId: entry.id }))
        set((state) => ({ entries: [entry, ...state.entries] }))
        return entry
      },
      updateDailyNote: (key, body) => {
        set((state) => ({ dailyNotes: { ...state.dailyNotes, [key]: body } }))
      },
      mergeNotebook: (incomingPages, incomingEntries, incomingDailyNotes) => {
        set((state) => {
          const pagesById = new Map(state.pages.map((p) => [p.id, p]))
          for (const p of incomingPages) pagesById.set(p.id, p)
          const entriesById = new Map(state.entries.map((e) => [e.id, e]))
          for (const e of incomingEntries) entriesById.set(e.id, e)
          return {
            pages: Array.from(pagesById.values()),
            entries: Array.from(entriesById.values()),
            dailyNotes: { ...state.dailyNotes, ...incomingDailyNotes },
          }
        })
      }
    }),
    { name: 'magpie-notebook', storage: createJSONStorage(() => idbStorage) }
  )
)
