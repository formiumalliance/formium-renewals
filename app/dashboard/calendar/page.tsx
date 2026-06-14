'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { PageHeader, Card, Button, LoadingPage, StatusBadge } from '@/components/ui'
import { ChevronLeft, ChevronRight, Globe, FileText } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns'
import { cn, formatAmcType } from '@/lib/utils'

type FilterType = 'both' | 'domains' | 'amc'

export default function CalendarPage() {
  const api = useApi()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [domains, setDomains] = useState<any[]>([])
  const [amcs, setAmcs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('both')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/domains?limit=500'),
      api.get('/api/amc?limit=500'),
    ]).then(([d, a]) => {
      setDomains(d.domains || [])
      setAmcs(a.amcs || [])
    }).finally(() => setLoading(false))
  }, [])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })

  // Get events for a given day
  const getEvents = (day: Date) => {
    const events: { type: 'domain' | 'amc'; item: any }[] = []

    if (filter !== 'amc') {
      domains.forEach(d => {
        if (isSameDay(parseISO(d.expiryDate), day)) {
          events.push({ type: 'domain', item: d })
        }
      })
    }
    if (filter !== 'domains') {
      amcs.forEach(a => {
        if (isSameDay(parseISO(a.expiryDate), day)) {
          events.push({ type: 'amc', item: a })
        }
      })
    }
    return events
  }

  const selectedEvents = selectedDay ? getEvents(selectedDay) : []

  // Start day of week (0=Sun)
  const firstDayOfWeek = startOfMonth(currentMonth).getDay()

  if (loading) return <LoadingPage />

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Calendar" description="View all domain and AMC expiry events" />

      <div className="flex items-center justify-between">
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => setCurrentMonth(m => subMonths(m, 1))} />
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 min-w-36 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => setCurrentMonth(m => addMonths(m, 1))} />
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
        </div>

        {/* Filter */}
        <div className="flex gap-1.5">
          {(['both', 'domains', 'amc'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition',
                filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {f === 'both' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2 p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
            {/* Empty cells for first week offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white dark:bg-slate-900 p-2 min-h-16" />
            ))}

            {days.map(day => {
              const events = getEvents(day)
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay!) ? null : day)}
                  className={cn(
                    'bg-white dark:bg-slate-900 p-2 min-h-16 cursor-pointer transition',
                    isSelected ? 'ring-2 ring-inset ring-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                    isToday(day) ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {events.slice(0, 2).map((e, i) => (
                      <div key={i} className={cn(
                        'text-xs truncate px-1 py-0.5 rounded',
                        e.type === 'domain' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                      )}>
                        {e.type === 'domain' ? e.item.domainName : formatAmcType(e.item.amcType)}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-xs text-slate-400 px-1">+{events.length - 2} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 px-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-500/30" />
              <span className="text-xs text-slate-400">Domain Expiry</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-200 dark:bg-purple-500/30" />
              <span className="text-xs text-slate-400">AMC Expiry</span>
            </div>
          </div>
        </Card>

        {/* Event Detail Panel */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
            {selectedDay ? format(selectedDay, 'MMMM d, yyyy') : 'Select a date'}
          </h3>

          {!selectedDay && (
            <p className="text-xs text-slate-400 text-center py-8">Click a date on the calendar to see events</p>
          )}

          {selectedDay && selectedEvents.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-8">No events on this date</p>
          )}

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {selectedEvents.map((e, i) => (
              <div key={i} className={cn(
                'p-3 rounded-xl border',
                e.type === 'domain' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' : 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {e.type === 'domain' ? (
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                  )}
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {e.type === 'domain' ? e.item.domainName : formatAmcType(e.item.amcType)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{e.item.client?.name}</p>
                {e.item.client?.companyName && <p className="text-xs text-slate-400">{e.item.client.companyName}</p>}
                <div className="mt-2">
                  <StatusBadge status={e.item.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
