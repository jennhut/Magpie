import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Artifact, ArtifactType } from '../types'
import { idbStorage } from './idbStorage'

interface AddArtifactInput {
  sourceLineId?: string
  type: ArtifactType
  text: string
  createdAt?: string
  reminderDate?: string
  date?: string
  heading?: string
}

interface ArtifactState {
  artifacts: Artifact[]
  addArtifact: (input: AddArtifactInput) => Artifact
  addArtifacts: (items: AddArtifactInput[]) => Artifact[]
  replaceSourceArtifacts: (sourcePrefix: string, items: AddArtifactInput[]) => void
  updateArtifact: (id: string, updates: Partial<Artifact>) => void
  toggleAction: (id: string) => void
  removeArtifact: (id: string) => void
}

const makeId = () => crypto.randomUUID()

function toArtifact(input: AddArtifactInput, existing?: Artifact): Artifact {
  return {
    id: existing?.id ?? makeId(),
    sourceLineId: input.sourceLineId,
    type: input.type,
    text: input.text.trim(),
    createdAt: existing?.createdAt ?? input.createdAt ?? new Date().toISOString(),
    completedAt: existing?.completedAt,
    reminderDate: input.reminderDate,
    date: input.date ?? existing?.date,
    heading: input.heading
  }
}

export const useArtifactStore = create<ArtifactState>()(
  persist(
    (set, get) => ({
      artifacts: [],
      addArtifact: (input) => {
        const artifact = toArtifact(input)
        set((state) => ({ artifacts: [artifact, ...state.artifacts] }))
        return artifact
      },
      addArtifacts: (items) => {
        const now = new Date().toISOString()
        const artifacts = items.map((item) => toArtifact({ ...item, createdAt: item.createdAt ?? now }))
        set((state) => ({ artifacts: [...artifacts, ...state.artifacts] }))
        return artifacts
      },
      replaceSourceArtifacts: (sourcePrefix, items) => {
        const current = get().artifacts
        const managed = current.filter((artifact) => artifact.sourceLineId?.startsWith(sourcePrefix))
        const unmanaged = current.filter((artifact) => !artifact.sourceLineId?.startsWith(sourcePrefix))
        const nextManaged = items.map((item) => {
          const existing = managed.find((artifact) => artifact.sourceLineId === item.sourceLineId || (artifact.type === item.type && artifact.text === item.text.trim()))
          return toArtifact(item, existing)
        })
        set({ artifacts: [...nextManaged, ...unmanaged] })
      },
      updateArtifact: (id, updates) => {
        set((state) => ({ artifacts: state.artifacts.map((artifact) => artifact.id === id ? { ...artifact, ...updates } : artifact) }))
      },
      toggleAction: (id) => {
        set({
          artifacts: get().artifacts.map((artifact) =>
            artifact.id === id && artifact.type === 'action'
              ? { ...artifact, completedAt: artifact.completedAt ? undefined : new Date().toISOString() }
              : artifact
          )
        })
      },
      removeArtifact: (id) => {
        set((state) => ({ artifacts: state.artifacts.filter((artifact) => artifact.id !== id) }))
      }
    }),
    { name: 'magpie-artifacts', storage: createJSONStorage(() => idbStorage) }
  )
)
