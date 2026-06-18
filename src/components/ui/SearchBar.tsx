import { Search } from 'lucide-react'

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-md border border-zinc-800/90 bg-zinc-950/80 pl-9 pr-3 text-sm text-zinc-100 shadow-inner shadow-black/20 outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10" placeholder="Search Magpie" />
    </label>
  )
}
