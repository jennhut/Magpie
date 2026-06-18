import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
          <Button variant="ghost" className="h-8 w-8 px-0" onClick={onClose} aria-label="Close" title="Close" icon={<X size={16} />} />
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
