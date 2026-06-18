import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: ReactNode
}

const variants = {
  primary: 'border-violet-400/70 bg-violet-500 text-white shadow-sm shadow-violet-950/40 hover:bg-violet-400 focus-visible:ring-violet-400/40',
  secondary: 'border-zinc-700/80 bg-zinc-900/90 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800 focus-visible:ring-zinc-500/30',
  ghost: 'border-transparent bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white focus-visible:ring-zinc-500/25',
  danger: 'border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 focus-visible:ring-rose-400/30'
}

export function Button({ className = '', variant = 'secondary', icon, children, ...props }: ButtonProps) {
  return (
    <button className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>
      {icon}
      {children}
    </button>
  )
}
