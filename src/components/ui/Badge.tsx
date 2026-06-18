import type { ArtifactType } from '../../types'

const styles: Record<ArtifactType, string> = {
  action: 'border-violet-400/40 bg-violet-400/10 text-violet-200',
  event: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  decision: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  question: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  risk: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
  reminder: 'border-orange-400/40 bg-orange-400/10 text-orange-200'
}

export function Badge({ type }: { type: ArtifactType }) {
  return <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-normal shadow-sm ${styles[type]}`}>{type}</span>
}
