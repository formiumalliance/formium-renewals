'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Sun, Moon, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Topbar({ title }: { title?: string }) {
  const [dark, setDark] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored === 'dark' || (!stored && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) router.push(`/dashboard/clients?search=${encodeURIComponent(search)}`)
  }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {title && (
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 mr-2 whitespace-nowrap">{title}</h1>
      )}

      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients, domains, AMC…"
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition"
          />
        </div>
      </form>

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
