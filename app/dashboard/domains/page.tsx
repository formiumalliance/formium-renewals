'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApi } from '@/hooks/useApi'
import { useSearchParams } from 'next/navigation'
import {
  PageHeader, Button, Modal, FormField, Input, Textarea, Select,
  Table, Th, Td, Tr, EmptyState, LoadingPage, Card, AlertBanner, StatusBadge
} from '@/components/ui'
import { Plus, Globe, Edit2, Trash2, RefreshCw, ExternalLink, Search, Filter } from 'lucide-react'
import { formatDate, getDaysUntilExpiry, cn } from '@/lib/utils'

interface Domain {
  id: string
  clientId: string
  domainName: string
  registrar?: string
  purchaseDate?: string
  creationDate?: string
  expiryDate: string
  autoRenew: boolean
  domainCost?: number
  loginUrl?: string
  notes?: string
  status: string
  client: { id: string; name: string; companyName?: string }
}

const emptyForm = {
  clientId: '', domainName: '', registrar: '', purchaseDate: '',
  creationDate: '', expiryDate: '', autoRenew: false,
  domainCost: '', loginUrl: '', notes: ''
}

const STATUS_FILTERS = ['', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED']

export default function DomainsPage() {
  const api = useApi()
  const searchParams = useSearchParams()
  const [domains, setDomains] = useState<Domain[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editDomain, setEditDomain] = useState<Domain | null>(null)
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm, clientId: searchParams.get('clientId') || '' })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [whoisLoading, setWhoisLoading] = useState(false)
  const [whoisError, setWhoisError] = useState('')
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const data = await api.get(`/api/domains?${params}`)
      setDomains(data.domains)
      setTotal(data.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/api/clients?limit=200')
      .then(d => setClients(d.clients))
      .catch(() => {})
  }, [])

  const openAdd = () => {
    setEditDomain(null)
    setForm({ ...emptyForm, clientId: searchParams.get('clientId') || '' })
    setWhoisError('')
    setModalOpen(true)
  }

  const openEdit = (d: Domain) => {
    setEditDomain(d)
    setForm({
      clientId: d.clientId,
      domainName: d.domainName,
      registrar: d.registrar || '',
      purchaseDate: d.purchaseDate ? d.purchaseDate.split('T')[0] : '',
      creationDate: d.creationDate ? d.creationDate.split('T')[0] : '',
      expiryDate: d.expiryDate.split('T')[0],
      autoRenew: d.autoRenew,
      domainCost: d.domainCost?.toString() || '',
      loginUrl: d.loginUrl || '',
      notes: d.notes || '',
    })
    setWhoisError('')
    setModalOpen(true)
  }

  const fetchWhois = async () => {
    if (!form.domainName.trim()) return
    setWhoisLoading(true)
    setWhoisError('')
    try {
      const data = await api.get(`/api/whois?domain=${encodeURIComponent(form.domainName)}`)
      if (data.success) {
        setForm(f => ({
          ...f,
          registrar: data.registrar || f.registrar,
          creationDate: data.creationDate || f.creationDate,
          expiryDate: data.expiryDate || f.expiryDate,
        }))
      } else {
        setWhoisError(data.error || 'Could not fetch WHOIS data. Please fill manually.')
      }
    } catch (e: any) {
      setWhoisError('WHOIS lookup failed. Please fill manually.')
    } finally { setWhoisLoading(false) }
  }

  const handleSave = async () => {
    if (!form.clientId || !form.domainName || !form.expiryDate) return
    setSaving(true)
    setError('')
    try {
      if (editDomain) {
        await api.put(`/api/domains/${editDomain.id}`, form)
      } else {
        await api.post('/api/domains', form)
      }
      setModalOpen(false)
      load()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/api/domains/${deleteId}`)
      setDeleteId(null)
      load()
    } catch (e: any) { setError(e.message) }
  }

  const pages = Math.ceil(total / limit)

  return (
    <div className="p-6">
      <PageHeader
        title="Domains"
        description={`${total} domains tracked`}
        action={<Button icon={Plus} onClick={openAdd}>Add Domain</Button>}
      />

      {error && <div className="mb-4"><AlertBanner type="error" message={error} /></div>}

      <Card>
        {/* Filters */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search domains…"
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
            />
          </div>
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition',
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? <LoadingPage /> : domains.length === 0 ? (
          <EmptyState icon={Globe} title="No domains found" description="Start tracking your client domains." action={<Button icon={Plus} onClick={openAdd}>Add Domain</Button>} />
        ) : (
          <Table>
            <thead className="bg-slate-50/60 dark:bg-slate-800/40">
              <tr>
                <Th>Domain</Th>
                <Th>Client</Th>
                <Th>Registrar</Th>
                <Th>Expiry Date</Th>
                <Th>Days Left</Th>
                <Th>Status</Th>
                <Th>Auto Renew</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {domains.map(d => {
                const days = getDaysUntilExpiry(d.expiryDate)
                return (
                  <Tr key={d.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{d.domainName}</span>
                        {d.loginUrl && (
                          <a href={d.loginUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 transition">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{d.client.name}</p>
                        {d.client.companyName && <p className="text-xs text-slate-400">{d.client.companyName}</p>}
                      </div>
                    </Td>
                    <Td><span className="text-slate-500">{d.registrar || '—'}</span></Td>
                    <Td><span className="text-slate-600 dark:text-slate-400">{formatDate(d.expiryDate)}</span></Td>
                    <Td>
                      <span className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        days <= 0 ? 'text-red-600 bg-red-50 dark:bg-red-500/10' :
                        days <= 7 ? 'text-red-600 bg-red-50 dark:bg-red-500/10' :
                        days <= 30 ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10' :
                        'text-green-600 bg-green-50 dark:bg-green-500/10'
                      )}>
                        {days <= 0 ? 'Expired' : `${days}d`}
                      </span>
                    </Td>
                    <Td><StatusBadge status={d.status} /></Td>
                    <Td>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', d.autoRenew ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100 dark:bg-slate-800')}>
                        {d.autoRenew ? 'On' : 'Off'}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(d)} />
                        <Button variant="ghost" size="sm" icon={Trash2}
                          className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          onClick={() => setDeleteId(d.id)} />
                      </div>
                    </Td>
                  </Tr>
                )
              })}
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

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editDomain ? 'Edit Domain' : 'Add Domain'} size="lg">
        <div className="space-y-4">
          {error && <AlertBanner type="error" message={error} />}

          <FormField label="Client" required>
            <Select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
              <option value="">Select a client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.companyName ? ` (${c.companyName})` : ''}</option>)}
            </Select>
          </FormField>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <FormField label="Domain Name" required>
                <Input
                  value={form.domainName}
                  onChange={e => setForm(f => ({ ...f, domainName: e.target.value }))}
                  placeholder="example.com"
                />
              </FormField>
            </div>
            <Button variant="outline" size="md" icon={RefreshCw} loading={whoisLoading} onClick={fetchWhois}>
              Fetch WHOIS
            </Button>
          </div>

          {whoisLoading && (
            <p className="text-xs text-blue-500 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" /> Fetching domain details…
            </p>
          )}
          {whoisError && <AlertBanner type="warning" message={whoisError} />}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Registrar">
              <Input value={form.registrar} onChange={e => setForm(f => ({ ...f, registrar: e.target.value }))} placeholder="GoDaddy, Namecheap…" />
            </FormField>
            <FormField label="Login URL">
              <Input value={form.loginUrl} onChange={e => setForm(f => ({ ...f, loginUrl: e.target.value }))} placeholder="https://registrar.com/login" />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Purchase Date">
              <Input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
            </FormField>
            <FormField label="Creation Date">
              <Input type="date" value={form.creationDate} onChange={e => setForm(f => ({ ...f, creationDate: e.target.value }))} />
            </FormField>
            <FormField label="Expiry Date" required>
              <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Domain Cost (₹)">
              <Input type="number" value={form.domainCost} onChange={e => setForm(f => ({ ...f, domainCost: e.target.value }))} placeholder="999" />
            </FormField>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="autoRenew"
                checked={form.autoRenew}
                onChange={e => setForm(f => ({ ...f, autoRenew: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoRenew" className="text-sm text-slate-700 dark:text-slate-300">Auto Renew Enabled</label>
            </div>
          </div>

          <FormField label="Notes">
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes…" />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editDomain ? 'Save Changes' : 'Add Domain'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Domain" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
          Are you sure you want to delete this domain? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
