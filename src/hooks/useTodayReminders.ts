import { useMemo } from 'react'
import { useArtifactStore } from '../store/artifactStore'
import { isIsoDateToday } from '../utils/dateUtils'

export function useTodayReminders() {
  const artifacts = useArtifactStore((state) => state.artifacts)
  return useMemo(
    () => artifacts.filter((artifact) => artifact.type === 'reminder' && isIsoDateToday(artifact.reminderDate)),
    [artifacts]
  )
}
