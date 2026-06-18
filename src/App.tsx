import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, Bell, CalendarDays, CheckSquare, ChevronLeft, ChevronRight, CircleHelp, Download, FileJson, Flame, Heading1, Lightbulb, NotebookPen, Plus, Search, ShieldAlert, Trash2, X } from 'lucide-react'
import { addDays, format, parseISO } from 'date-fns'
import type { Artifact, ArtifactType, RouteId } from './types'
import { useArtifactStore } from './store/artifactStore'
import { useNotebookStore } from './store/notebookStore'
import { artifactTypes, parseTaggedLines } from './utils/slashParser'
import { downloadFile, exportJson, exportMarkdown } from './utils/exportUtils'
import { formatDate, formatDateTime } from './utils/dateUtils'
import { useSlashCommand } from './hooks/useSlashCommand'
import { Badge } from './components/ui/Badge'
import { Button } from './components/ui/Button'
import { SearchBar } from './components/ui/SearchBar'

const navItems: Array<{ id: RouteId; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'notebook', label: 'Notebook', icon: NotebookPen },
  { id: 'actions', label: 'Actions', icon: CheckSquare },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'decisions', label: 'Decisions', icon: Lightbulb },
  { id: 'questions', label: 'Questions', icon: CircleHelp },
  { id: 'risks', label: 'Risks', icon: ShieldAlert },
  { id: 'reminders', label: 'Reminders', icon: Bell }
]

const iconByType: Record<ArtifactType, React.ComponentType<{ size?: number }>> = {
  action: CheckSquare,
  event: CalendarDays,
  decision: Lightbulb,
  question: CircleHelp,
  risk: Flame,
  reminder: Bell
}

const tagButtonStyles: Record<ArtifactType, string> = {
  action: 'border-violet-400/45 bg-violet-400/10 text-violet-100 hover:bg-violet-400/15 hover:border-violet-300/60 focus-visible:ring-violet-400/30',
  event: 'border-sky-400/45 bg-sky-400/10 text-sky-100 hover:bg-sky-400/15 hover:border-sky-300/60 focus-visible:ring-sky-400/30',
  decision: 'border-amber-400/45 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15 hover:border-amber-300/60 focus-visible:ring-amber-400/30',
  question: 'border-emerald-400/45 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15 hover:border-emerald-300/60 focus-visible:ring-emerald-400/30',
  risk: 'border-rose-400/45 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15 hover:border-rose-300/60 focus-visible:ring-rose-400/30',
  reminder: 'border-orange-400/45 bg-orange-400/10 text-orange-100 hover:bg-orange-400/15 hover:border-orange-300/60 focus-visible:ring-orange-400/30'
}
const todayKey = () => format(new Date(), 'yyyy-MM-dd')
const shiftDateKey = (dateKey: string, amount: number) => format(addDays(parseISO(dateKey), amount), 'yyyy-MM-dd')

export default function App() {
  const [route, setRoute] = useState<RouteId>('actions')
  const [search, setSearch] = useState('')
  const [selectedNotebookDate, setSelectedNotebookDate] = useState(todayKey())
  const pages = useNotebookStore((state) => state.pages)
  const entries = useNotebookStore((state) => state.entries)
  const dailyNotes = useNotebookStore((state) => state.dailyNotes)
  const artifacts = useArtifactStore((state) => state.artifacts)

  const results = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return []
    const dailyResults = Object.entries(dailyNotes)
      .filter(([, body]) => body.toLowerCase().includes(term))
      .map(([date, body]) => ({ id: date, type: 'note' as const, label: `Daily note ${date}`, excerpt: body.slice(0, 120), date }))
    const artifactResults = artifacts
      .filter((artifact) => `${artifact.heading ?? ''} ${artifact.text}`.toLowerCase().includes(term))
      .map((artifact) => ({ id: artifact.id, type: artifact.type, label: artifact.heading ? `${artifact.heading}: ${artifact.type}` : artifact.type, excerpt: formatArtifactText(artifact).slice(0, 120), artifact }))
    return [...dailyResults, ...artifactResults].slice(0, 12)
  }, [artifacts, dailyNotes, search])

  const openSource = (artifact: Artifact) => {
    if (!artifact.sourceLineId) return
    const sourceDate = artifact.sourceLineId.match(/^daily:(\d{4}-\d{2}-\d{2}):/)?.[1]
    if (sourceDate) setSelectedNotebookDate(sourceDate)
    setRoute('notebook')
    window.setTimeout(() => document.getElementById('daily-note')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80)
  }

  const openSearchResult = (result: SearchResultItem) => {
    setSearch('')
    if (result.type === 'note') {
      setSelectedNotebookDate(result.date)
      setRoute('notebook')
      window.setTimeout(() => document.getElementById('daily-note')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80)
      return
    }

    if (result.artifact?.sourceLineId) {
      openSource(result.artifact)
      return
    }

    const routeByType: Record<ArtifactType, RouteId> = {
      action: 'actions',
      event: 'events',
      decision: 'decisions',
      question: 'questions',
      risk: 'risks',
      reminder: 'reminders'
    }
    setRoute(routeByType[result.type])
  }

  const runExport = (kind: 'json' | 'markdown') => {
    if (kind === 'json') downloadFile('magpie-export.json', exportJson(pages, entries, artifacts, dailyNotes), 'application/json')
    else downloadFile('magpie-export.md', exportMarkdown(pages, entries, artifacts, dailyNotes), 'text/markdown')
  }

  return (
    <div className="min-h-screen text-zinc-100">
      <TopNav route={route} setRoute={setRoute} search={search} setSearch={setSearch} results={results} onResultClick={openSearchResult} onExport={runExport} />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {route === 'actions' && <ActionTracker onOpenSource={openSource} />}
        {route === 'notebook' && <NotebookView selectedDate={selectedNotebookDate} setSelectedDate={setSelectedNotebookDate} />}
        {route === 'events' && <ArtifactLog type="event" onOpenSource={openSource} />}
        {route === 'decisions' && <ArtifactLog type="decision" onOpenSource={openSource} />}
        {route === 'questions' && <ArtifactLog type="question" onOpenSource={openSource} />}
        {route === 'risks' && <ArtifactLog type="risk" onOpenSource={openSource} />}
        {route === 'reminders' && <ArtifactLog type="reminder" onOpenSource={openSource} />}
      </main>
    </div>
  )
}

type SearchResultItem =
  | { id: string; type: 'note'; label: string; excerpt: string; date: string }
  | { id: string; type: ArtifactType; label: string; excerpt: string; artifact: Artifact }

function TopNav({ route, setRoute, search, setSearch, results, onResultClick, onExport }: { route: RouteId; setRoute: (route: RouteId) => void; search: string; setSearch: (value: string) => void; results: SearchResultItem[]; onResultClick: (result: SearchResultItem) => void; onExport: (kind: 'json' | 'markdown') => void }) {
  const [exportOpen, setExportOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/82 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button className="flex items-center gap-3 text-left" onClick={() => setRoute('actions')}>
            <span className="grid h-10 w-10 place-items-center rounded-md border border-amber-300/30 bg-amber-300/10 text-amber-200 shadow-inner shadow-amber-950/30"><Archive size={18} /></span>
            <span><span className="block text-lg font-semibold tracking-normal">Magpie</span><span className="block text-xs text-zinc-500">Capture, tag, track</span></span>
          </button>
          <div className="relative flex flex-1 justify-center">
            <SearchBar value={search} onChange={setSearch} />
            {results.length > 0 && <SearchResults results={results} onResultClick={onResultClick} />}
          </div>
          <div className="relative flex gap-2">
            <Button variant="ghost" icon={<Download size={16} />} onClick={() => setExportOpen((value) => !value)}>Export</Button>
            {exportOpen && (
              <div className="absolute right-0 top-11 z-50 w-48 rounded-lg border border-zinc-800/90 bg-zinc-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur">
                <button className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900" onClick={() => onExport('json')}><FileJson size={15} /> JSON</button>
                <button className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900" onClick={() => onExport('markdown')}><Download size={15} /> Markdown</button>
              </div>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto rounded-md bg-zinc-950/40 p-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return <button key={item.id} onClick={() => setRoute(item.id)} className={`flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition ${route === item.id ? 'bg-zinc-800 text-white shadow-sm shadow-black/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'}`}><Icon size={15} />{item.label}</button>
          })}
        </nav>
      </div>
    </header>
  )
}

function SearchResults({ results, onResultClick }: { results: SearchResultItem[]; onResultClick: (result: SearchResultItem) => void }) {
  return <div className="absolute top-11 z-50 w-full max-w-md rounded-lg border border-zinc-800/90 bg-zinc-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur">{results.map((result) => <button key={`${result.type}-${result.id}`} onMouseDown={(event) => event.preventDefault()} onClick={() => onResultClick(result)} className="block w-full rounded px-3 py-2 text-left hover:bg-zinc-900"><div className="flex items-center gap-2 text-xs uppercase text-zinc-500"><Search size={12} />{result.type}</div><div className="mt-1 text-sm text-zinc-100">{result.label}</div><p className="mt-1 line-clamp-2 text-xs text-zinc-500">{result.excerpt}</p></button>)}</div>
}

function ActionTracker({ onOpenSource }: { onOpenSource: (artifact: Artifact) => void }) {
  const [draftOpen, setDraftOpen] = useState(false)
  const artifacts = useArtifactStore((state) => state.artifacts)
  const actions = artifacts.filter((artifact) => artifact.type === 'action')
  const active = actions.filter((action) => !action.completedAt)
  const done = actions.filter((action) => action.completedAt)
  return (
    <section className="grid gap-5">
      <PageHeader title="Action Tracker" subtitle={`${active.length} open, ${done.length} done`} action={<Button variant="primary" className="h-9 w-9 px-0" icon={<Plus size={16} />} title="Add action" aria-label="Add action" onClick={() => setDraftOpen(true)} />} />
      <ActionList title="Open" actions={active} onOpenSource={onOpenSource} draftOpen={draftOpen} onDraftClose={() => setDraftOpen(false)} />
      <details className="rounded-lg border border-zinc-800/90 bg-zinc-950/72 shadow-xl shadow-black/18" open={done.length > 0}>
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-300">Done ({done.length})</summary>
        <div className="border-t border-zinc-800"><ActionList title="" actions={done} onOpenSource={onOpenSource} compact /></div>
      </details>
    </section>
  )
}

function formatArtifactText(artifact: Artifact) {
  return artifact.heading ? `${artifact.heading}: ${artifact.text}` : artifact.text
}
function OptionalDateControl({ value, onChange, label }: { value?: string; onChange: (value?: string) => void; label: string }) {
  const [editing, setEditing] = useState(false)
  if (value || editing) {
    return (
      <input
        type="date"
        value={value ?? ''}
        onChange={(event) => {
          onChange(event.target.value || undefined)
          if (event.target.value) setEditing(false)
        }}
        onBlur={() => { if (!value) setEditing(false) }}
        className="h-8 rounded-md border border-zinc-800/90 bg-zinc-900/92 px-2 text-xs text-zinc-200 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10"
        aria-label={label}
        autoFocus={editing}
      />
    )
  }
  return <Button variant="ghost" className="h-8 w-8 px-0" title={label} aria-label={label} icon={<CalendarDays size={15} />} onClick={() => setEditing(true)} />
}
function ActionList({ title, actions, onOpenSource, compact = false, draftOpen = false, onDraftClose }: { title: string; actions: Artifact[]; onOpenSource: (artifact: Artifact) => void; compact?: boolean; draftOpen?: boolean; onDraftClose?: () => void }) {
  const toggleAction = useArtifactStore((state) => state.toggleAction)
  const removeArtifact = useArtifactStore((state) => state.removeArtifact)
  const updateArtifact = useArtifactStore((state) => state.updateArtifact)
  return (
    <div className={compact ? '' : 'rounded-lg border border-zinc-800 bg-zinc-950/60'}>
      {title && <div className="border-b border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300">{title}</div>}
      <div className="divide-y divide-zinc-900">
        {draftOpen && <InlineActionDraft onClose={onDraftClose} />}
        {actions.map((action) => (
          <div key={action.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-center">
            <input type="checkbox" checked={Boolean(action.completedAt)} onChange={() => toggleAction(action.id)} className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-violet-500" />
            <span className={`text-sm ${action.completedAt ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>{formatArtifactText(action)}</span>
            <OptionalDateControl value={action.date} onChange={(date) => updateArtifact(action.id, { date })} label="Add action due date" />
            {action.sourceLineId && <Button variant="ghost" className="h-8 w-8 px-0" title="Open source note" aria-label="Open source note" icon={<NotebookPen size={15} />} onClick={() => onOpenSource(action)} />}
            <Button variant="ghost" className="h-8 w-8 px-0" title="Delete" aria-label="Delete" icon={<Trash2 size={15} />} onClick={() => removeArtifact(action.id)} />
          </div>
        ))}
        {actions.length === 0 && !draftOpen && <div className="px-4 py-10 text-center text-sm text-zinc-500">{title ? `No ${title.toLowerCase()} actions` : 'No completed actions'}</div>}
      </div>
    </div>
  )
}

function InlineActionDraft({ onClose }: { onClose?: () => void }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const addArtifact = useArtifactStore((state) => state.addArtifact)
  const commit = () => {
    const value = text.trim()
    if (!value) {
      onClose?.()
      return
    }
    addArtifact({ type: 'action', text: value, date: date || undefined })
    setText('')
    setDate('')
    onClose?.()
  }
  return (
    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center">
      <input type="checkbox" disabled className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 opacity-40" />
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') onClose?.()
        }}
        className="h-9 rounded-md border border-zinc-800/90 bg-zinc-900/92 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10"
        placeholder="New action"
        autoFocus
      />
      {date ? <input
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') onClose?.()
        }}
        className="h-9 rounded-md border border-zinc-800/90 bg-zinc-900/92 px-2 text-xs text-zinc-200 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10"
        aria-label="Action due date"
      /> : <Button variant="ghost" className="h-8 w-8 px-0" title="Add action due date" aria-label="Add action due date" icon={<CalendarDays size={15} />} onClick={() => setDate(new Date().toISOString().slice(0, 10))} />}
      <Button variant="ghost" className="h-8 w-8 px-0" title="Cancel" aria-label="Cancel" icon={<X size={15} />} onClick={onClose} />
    </div>
  )
}

function NotebookView({ selectedDate, setSelectedDate }: { selectedDate: string; setSelectedDate: React.Dispatch<React.SetStateAction<string>> }) {
  const artifacts = useArtifactStore((state) => state.artifacts)
  const reminders = artifacts.filter((artifact) => artifact.type === 'reminder' && artifact.reminderDate === selectedDate)
  const isToday = selectedDate === todayKey()
  return (
    <section className="grid gap-5">
      <PageHeader
        title="Notebook"
        subtitle={format(parseISO(selectedDate), 'EEEE d MMMM yyyy')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" className="h-9 w-9 px-0" icon={<ChevronLeft size={16} />} title="Previous day" aria-label="Previous day" onClick={() => setSelectedDate((date) => shiftDateKey(date, -1))} />
            <label className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value || todayKey())}
                className="h-9 rounded-md border border-zinc-800/90 bg-zinc-900/92 pl-9 pr-2 text-sm text-zinc-100 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10"
                aria-label="Notebook date"
              />
            </label>
            <Button variant="secondary" className="h-9 w-9 px-0" icon={<ChevronRight size={16} />} title="Next day" aria-label="Next day" onClick={() => setSelectedDate((date) => shiftDateKey(date, 1))} />
            <Button variant={isToday ? 'ghost' : 'secondary'} onClick={() => setSelectedDate(todayKey())}>Today</Button>
          </div>
        }
      />
      {reminders.length > 0 && <ReminderBanner reminders={reminders} />}
      <DailyNoteEditor dateKey={selectedDate} />
    </section>
  )
}

function DailyNoteEditor({ dateKey }: { dateKey: string }) {
  const body = useNotebookStore((state) => state.dailyNotes[dateKey] ?? '')
  const updateDailyNote = useNotebookStore((state) => state.updateDailyNote)
  const replaceSourceArtifacts = useArtifactStore((state) => state.replaceSourceArtifacts)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { isOpen, setCursor } = useSlashCommand(body)
  const sourcePrefix = `daily:${dateKey}:`

  const syncArtifacts = (nextBody: string) => {
    const taggedLines = parseTaggedLines(nextBody)
    replaceSourceArtifacts(sourcePrefix, taggedLines.map((line, index) => ({
      sourceLineId: `${sourcePrefix}${index}`,
      type: line.type,
      text: line.text,
      createdAt: line.createdAt,
      reminderDate: line.reminderDate,
      date: line.date,
      heading: line.heading
    })))
  }

  const syncText = (nextBody: string) => {
    updateDailyNote(dateKey, nextBody)
    syncArtifacts(nextBody)
  }

  useEffect(() => {
    syncArtifacts(body)
  }, [body, sourcePrefix])

  const insertHeading = () => {
    const target = inputRef.current
    if (!target) return
    const start = target.selectionStart
    const beforeCursor = body.slice(0, start)
    const lineStart = beforeCursor.lastIndexOf('\n') + 1
    const prefix = body.slice(lineStart, lineStart + 2) === '# ' ? '' : '# '
    const next = `${body.slice(0, lineStart)}${prefix}${body.slice(lineStart)}`
    syncText(next)
    window.setTimeout(() => {
      target.focus()
      target.selectionStart = target.selectionEnd = start + prefix.length
    }, 0)
  }

  const insertCommand = (type: ArtifactType) => {
    const target = inputRef.current
    if (!target) return
    const start = target.selectionStart
    const beforeCursor = body.slice(0, start)
    const afterCursor = body.slice(start)
    const lineStart = beforeCursor.lastIndexOf('\n') + 1
    const nextBreak = afterCursor.indexOf('\n')
    const lineEnd = nextBreak === -1 ? body.length : start + nextBreak
    const rawLine = body.slice(lineStart, lineEnd)
    const untaggedLine = rawLine.replace(/^\s*\/(action|event|decision|question|risk|reminder)\b\s*/i, '').replace(/\s*\/[a-z]*\s*$/i, '').trim()
    const command = `/${type} ${untaggedLine}`.trimEnd()
    const next = `${body.slice(0, lineStart)}${command}${body.slice(lineEnd)}`
    const nextValue = next.endsWith(`/${type}`) ? `${next} ` : next
    const nextCursor = lineStart + (nextValue.slice(lineStart).match(/^[^\r\n]*/)?.[0].length ?? command.length)
    syncText(nextValue)
    window.setTimeout(() => {
      target.focus()
      target.selectionStart = target.selectionEnd = nextCursor
    }, 0)
  }

  const taggedCount = parseTaggedLines(body).length

  return (
    <div id="daily-note" className="rounded-lg border border-zinc-800/90 bg-zinc-950/72 p-4 shadow-xl shadow-black/18">
      <div className="mb-3 flex justify-end text-xs text-zinc-500">Autosaved · {taggedCount} live tags</div>
      <div className="relative">
        <textarea
          ref={inputRef}
          value={body}
          onChange={(event) => { syncText(event.target.value); setCursor(event.target.selectionStart) }}
          onKeyUp={(event) => setCursor(event.currentTarget.selectionStart)}
          className="min-h-[65vh] w-full resize-y rounded-md border border-zinc-800/90 bg-zinc-900/92 p-4 text-base leading-7 text-zinc-100 shadow-inner shadow-black/25 outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10"
          placeholder="Use this as this day's notebook. Add headings with # Meeting name, then type /action, /event, /decision, /question, /risk, or /reminder. Tagged items keep the latest heading as context."
        />
        {isOpen && <SlashMenu onPick={insertCommand} />}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-900 pt-3">
        <Button variant="ghost" className="tag-button tag-button-heading h-8 px-2" icon={<Heading1 size={14} />} onClick={insertHeading}>heading</Button>
        {artifactTypes.map((type) => {
          const Icon = iconByType[type]
          return <Button key={type} variant="ghost" className={`tag-button tag-button-${type} h-8 px-2`} icon={<Icon size={14} />} onClick={() => insertCommand(type)}>{type}</Button>
        })}
      </div>
    </div>
  )
}

function SlashMenu({ onPick }: { onPick: (type: ArtifactType) => void }) {
  return <div className="absolute bottom-12 left-3 grid w-56 gap-1 rounded-md border border-zinc-800 bg-zinc-950 p-2 shadow-xl">{artifactTypes.map((type) => { const Icon = iconByType[type]; return <button key={type} className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900" onClick={() => onPick(type)}><Icon size={15} /><Badge type={type} /></button> })}</div>
}

function ReminderBanner({ reminders }: { reminders: Artifact[] }) {
  return <div className="rounded-lg border border-orange-400/30 bg-orange-400/10 p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-100"><Bell size={16} />Due today</div><div className="grid gap-2">{reminders.map((reminder) => <div key={reminder.id} className="text-sm text-orange-50">{reminder.text}</div>)}</div></div>
}

function ArtifactLog({ type, onOpenSource }: { type: ArtifactType; onOpenSource: (artifact: Artifact) => void }) {
  const [draftOpen, setDraftOpen] = useState(false)
  const artifacts = useArtifactStore((state) => state.artifacts).filter((artifact) => artifact.type === type)
  const removeArtifact = useArtifactStore((state) => state.removeArtifact)
  const updateArtifact = useArtifactStore((state) => state.updateArtifact)
  const Icon = iconByType[type]
  const today = todayKey()

  const eventSort = (a: Artifact, b: Artifact) => (a.date ?? '9999-12-31').localeCompare(b.date ?? '9999-12-31') || a.createdAt.localeCompare(b.createdAt)
  const upcomingEvents = type === 'event' ? artifacts.filter((artifact) => !artifact.date || artifact.date >= today).sort(eventSort) : []
  const pastEvents = type === 'event' ? artifacts.filter((artifact) => artifact.date && artifact.date < today).sort(eventSort) : []
  const visibleArtifacts = type === 'event' ? upcomingEvents : artifacts

  const renderArtifact = (artifact: Artifact) => (
    <div key={artifact.id} className="flex items-start gap-3 border-b border-zinc-900 px-4 py-4 last:border-b-0">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-md border border-zinc-800/90 bg-zinc-900/92 text-zinc-300 shadow-inner shadow-black/20"><Icon size={15} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge type={type} />
          {type === 'event' && <OptionalDateControl value={artifact.date} onChange={(date) => updateArtifact(artifact.id, { date })} label="Add event date" />}
          {type === 'reminder' && <OptionalDateControl value={artifact.reminderDate} onChange={(reminderDate) => updateArtifact(artifact.id, { reminderDate })} label="Add reminder date" />}
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-200">{formatArtifactText(artifact)}</p>
        <p className="mt-2 text-xs text-zinc-600">{formatDateTime(artifact.createdAt)}</p>
      </div>
      <div className="flex gap-1">
        {artifact.sourceLineId && <Button variant="ghost" className="h-8 w-8 px-0" title="Open source note" aria-label="Open source note" icon={<NotebookPen size={15} />} onClick={() => onOpenSource(artifact)} />}
        <Button variant="ghost" className="h-8 w-8 px-0" title="Delete" aria-label="Delete" icon={<Trash2 size={15} />} onClick={() => removeArtifact(artifact.id)} />
      </div>
    </div>
  )

  return (
    <section className="grid gap-5">
      <PageHeader
        title={`${type[0].toUpperCase()}${type.slice(1)} Log`}
        subtitle={`${artifacts.length} ${artifacts.length === 1 ? 'item' : 'items'}`}
        action={<Button variant="primary" className="h-9 w-9 px-0" icon={<Plus size={16} />} title={`Add ${type}`} aria-label={`Add ${type}`} onClick={() => setDraftOpen(true)} />}
      />
      <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/72 shadow-xl shadow-black/18">
        {draftOpen && <InlineArtifactDraft type={type} onClose={() => setDraftOpen(false)} />}
        {visibleArtifacts.length === 0 && !draftOpen ? <EmptyState label={`No ${type}s yet`} /> : visibleArtifacts.map(renderArtifact)}
      </div>
      {type === 'event' && pastEvents.length > 0 && (
        <details className="rounded-lg border border-zinc-800/90 bg-zinc-950/72 shadow-xl shadow-black/18">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-300">Past Events ({pastEvents.length})</summary>
          <div className="border-t border-zinc-800">{pastEvents.map(renderArtifact)}</div>
        </details>
      )}
    </section>
  )
}

function InlineArtifactDraft({ type, onClose }: { type: ArtifactType; onClose: () => void }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const addArtifact = useArtifactStore((state) => state.addArtifact)
  const Icon = iconByType[type]
  const commit = () => {
    const value = text.trim()
    if (!value) {
      onClose()
      return
    }
    addArtifact({
      type,
      text: value,
      date: type === 'event' ? date || undefined : undefined,
      reminderDate: type === 'reminder' ? date || undefined : undefined
    })
    setText('')
    setDate('')
    onClose()
  }
  return (
    <div className="grid gap-3 border-b border-zinc-900 px-4 py-4 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center">
      <span className="grid h-8 w-8 place-items-center rounded-md border border-zinc-800/90 bg-zinc-900/92 text-zinc-300 shadow-inner shadow-black/20"><Icon size={15} /></span>
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') onClose()
        }}
        className="h-9 rounded-md border border-zinc-800/90 bg-zinc-900/92 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10"
        placeholder={`New ${type}`}
        autoFocus
      />
      {(type === 'event' || type === 'reminder') && (
        date ? <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
            if (event.key === 'Escape') onClose()
          }}
          className="h-9 rounded-md border border-zinc-800/90 bg-zinc-900/92 px-2 text-xs text-zinc-200 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10"
          aria-label={`Add ${type} date`}
        /> : <Button variant="ghost" className="h-8 w-8 px-0" title={`Add ${type} date`} aria-label={`Add ${type} date`} icon={<CalendarDays size={15} />} onClick={() => setDate(new Date().toISOString().slice(0, 10))} />
      )}
      <Button variant="ghost" className="h-8 w-8 px-0" title="Cancel" aria-label="Cancel" icon={<X size={15} />} onClick={onClose} />
    </div>
  )
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-normal text-white">{title}</h1>{subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}</div>{action}</div>
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-lg border border-dashed border-zinc-800/90 bg-zinc-950/45 px-4 py-10 text-center text-sm text-zinc-500">{label}</div>
}






















