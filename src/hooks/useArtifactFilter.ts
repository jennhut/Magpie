import { useState, useMemo } from 'react'
import type { Artifact } from '../types'

export const NO_HEADING = '__none__'

export interface ArtifactFilterState {
  headings: string[]
  addedFrom: string
  addedTo: string
  dateFrom: string
  dateTo: string
}

export interface HeadingOption {
  key: string
  label: string
  count: number
}

const EMPTY: ArtifactFilterState = { headings: [], addedFrom: '', addedTo: '', dateFrom: '', dateTo: '' }

export function useArtifactFilter(artifacts: Artifact[]) {
  const [filters, setFilters] = useState<ArtifactFilterState>(EMPTY)

  const availableHeadings = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of artifacts) {
      const key = a.heading ?? NO_HEADING
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([key, count]) => ({ key, label: key === NO_HEADING ? 'No heading' : key, count }))
      .sort((a, b) =>
        a.key === NO_HEADING ? 1 : b.key === NO_HEADING ? -1 : a.label.localeCompare(b.label)
      )
  }, [artifacts])

  const filtered = useMemo(() => {
    return artifacts.filter((a) => {
      if (filters.headings.length > 0) {
        const key = a.heading ?? NO_HEADING
        if (!filters.headings.includes(key)) return false
      }
      const addedDate = a.createdAt.slice(0, 10)
      if (filters.addedFrom && addedDate < filters.addedFrom) return false
      if (filters.addedTo && addedDate > filters.addedTo) return false
      const artifactDate = a.date ?? a.reminderDate
      if (filters.dateFrom && (!artifactDate || artifactDate < filters.dateFrom)) return false
      if (filters.dateTo && (!artifactDate || artifactDate > filters.dateTo)) return false
      return true
    })
  }, [artifacts, filters])

  const hasActiveFilters =
    filters.headings.length > 0 ||
    !!(filters.addedFrom || filters.addedTo || filters.dateFrom || filters.dateTo)

  const activeFilterCount =
    (filters.headings.length > 0 ? 1 : 0) +
    (filters.addedFrom || filters.addedTo ? 1 : 0) +
    (filters.dateFrom || filters.dateTo ? 1 : 0)

  const toggleHeading = (key: string) =>
    setFilters((f) => ({
      ...f,
      headings: f.headings.includes(key)
        ? f.headings.filter((h) => h !== key)
        : [...f.headings, key],
    }))

  const update = (partial: Partial<ArtifactFilterState>) =>
    setFilters((f) => ({ ...f, ...partial }))

  const clear = () => setFilters(EMPTY)

  return { filters, filtered, availableHeadings, hasActiveFilters, activeFilterCount, toggleHeading, update, clear }
}
