'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApi } from '@/hooks/useApi'
import {
  PageHeader, Table, Th, Td, Tr, EmptyState, LoadingPage, Card, StatusBadge, Button
} from '@/components/ui'
import { Mail, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const EMAIL_TYPE_LABELS: Record<string, string> = {
  DOMAIN_EXPIRY_30: 'Domain — 30 Day Reminder',
  DOMAIN_EXPIRY_15: 'Domain — 15 Day Reminder',
  DOMAIN_EXPIRY_7: 'Domain — 7 Day Reminder',
  DOMAIN_EXPIRED: 'Domain — Expired',
  AMC_EXPIRY_30: 'AMC — 30 Day Reminder',
  AMC_EXPIRY_15: 'AMC — 15 Day Reminder',
  AMC_EXPIRY_7: 'AMC — 7 Day Reminder',
  AMC_EXPIRED: 'AMC — Expired',
}

export default function EmailLogsPage() {
  const api = useApi()
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 30

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter) params.set('status', statusFilter)
      const data = await api.get(`/api/email-logs?${params}`)
      setLogs(data.logs)
      setTotal(data.total)
    } catch (e) {}
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const pages = Math.ceil(total / limit)
  const sentCount = logs.filter(l => l.status === 'SENT').length
  const failedCount = logs.filter(l => l.status === 'FAILED').length

  return (
    <div className="p-6">
      <PageHeader title="Email Logs" description={`${total} total emails logged`} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Logged', value: total, icon: Mail, color: 'text-blue-500' },
          { label: 'Sent', value: sentCount, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Failed', value: failedCount, icon: XCircle, color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="flex items-center gap-3 px-5 py-4">
            <Icon className={cn('w-5 h-5', color)} />
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          {['', 'SENT', 'FAILED'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition',
                statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700')}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? <LoadingPage /> : logs.length === 0 ? (
          <EmptyState icon={Mail} title="No email logs yet" description="Email logs will appear here once reminders are sent." />
        ) : (
          <Table>
            <thead className="bg-slate-50/60 dark:bg-slate-800/40">
              <tr>
                <Th>Status</Th>
                <Th>Type</Th>
                <Th>Recipient</Th>
                <Th>Subject</Th>
                <Th>Related To</Th>
                <Th>Sent At</Th>
                <Th>Error</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <Tr key={log.id}>
                  <Td>
                    <StatusBadge status={log.status} />
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {EMAIL_TYPE_LABELS[log.emailType] || log.emailType}
                    </span>
                  </Td>
                  <Td><span className="text-slate-700 dark:text-slate-300 text-xs">{log.recipient}</span></Td>
                  <Td className="max-w-xs">
                    <span className="text-xs text-slate-500 truncate block max-w-xs">{log.subject}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-500">
                      {log.domain?.domainName || log.amcContract?.amcType || '—'}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-400">
                      {format(new Date(log.sentAt), 'dd MMM yyyy, hh:mm a')}
                    </span>
                  </Td>
                  <Td>
                    {log.errorMessage ? (
                      <span className="text-xs text-red-500 max-w-xs block truncate" title={log.errorMessage}>
                        {log.errorMessage}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400">Page {page} of {pages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
