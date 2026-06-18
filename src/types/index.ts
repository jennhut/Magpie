export type ArtifactType = 'action' | 'event' | 'decision' | 'question' | 'risk' | 'reminder'

export interface Entry {
  id: string
  pageId: string
  createdAt: string
  heading?: string
  body: string
  taggedLines: TaggedLine[]
}

export interface TaggedLine {
  id: string
  entryId: string
  text: string
  type: ArtifactType
  createdAt: string
  reminderDate?: string
  date?: string
  heading?: string
}

export interface Artifact {
  id: string
  sourceLineId?: string
  type: ArtifactType
  text: string
  createdAt: string
  completedAt?: string
  reminderDate?: string
  date?: string
  heading?: string
}

export interface Page {
  id: string
  title: string
  createdAt: string
}

export type RouteId = 'actions' | 'notebook' | 'events' | 'decisions' | 'questions' | 'risks' | 'reminders'

export interface SearchResult {
  id: string
  type: 'note' | ArtifactType
  label: string
  excerpt: string
}
