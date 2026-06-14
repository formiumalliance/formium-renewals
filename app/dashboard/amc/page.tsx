'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApi } from '@/hooks/useApi'
import { useSearchParams } from 'next/navigation'
import {
  PageHeader, Button, Modal, FormField, Input, Textarea, Select,
  Table, Th, Td, Tr, EmptyState, LoadingPage, Card, AlertBanner, StatusBadge
} from '@/components/ui'
import { Plus, FileText, Edit2, Trash2, RefreshCw, Search } from 'lucide-react'
import { formatDate, getDaysUntilExpiry, formatCurrency, formatAmcType, cn } from '@/lib/utils'

const AMC_TYPES = [
  { value: 'WEBSITE_MAINTENANCE', label: 'Website Maintenance' },
  { value: 'SEO', label: 'SEO' },
  { value: 'ADS_MANAGEMENT', label: 'Ads Management' },
  { value: 'HOSTING', label: 'Hosting' },
  { value: 'DOMAIN_MANAGEMENT', label: 'Domain Management' },
  { value: 'CUSTOM', label: 'Custom' },
]

const STATUS_FILTERS = ['', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED']
const PAYMENT_FILTERS = ['', 'PAID', 'PENDING']

const emptyForm = {
  clientId: '', amcType: 'WEBSITE_MAINTENANCE', customType: '',
  startDate: '', expiryDate: '', amount: '', paymentStatus: 'PENDING', notes: ''
}

export default function AmcPage() {
  const api = useApi()
  const searchParams = useSearchParams()
  const [amcs, setAmcs] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [renewModal, setRenewModal] = useState<any>(null)
  const [editAmc, setEditAmc] = useState<any | null>(null)
  const [form, setForm] = useState({ ...emptyForm, clientId: searchParams.get('clientId') || '' })
  const [renewForm, setRenewForm] = useState({ startDate: '', expiryDate: '', paymentStatus: 'PAID' })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (paymentFilter) params.set('paymentStatus', paymentFilter)
      const data = await api.get(`/api/amc?${params}`)
      setAmcs(data.amcs)
      setTotal(data.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search, statusFilter, paymentFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/api/clients?limit=200').then(d => setClients(d.clients)).catch(() => {})
  }, [])

  const openAdd = () => {
    setEditAmc(null)
    setForm({ ...emptyForm, clientId: searchParams.get('clientId') || '' })
    setModalOpen(true)
  }

  const openEdit = (a: any) => {
    setEditAmc(a)
    setForm({
      clientId: a.clientId,
      amcType: a.amcType,
      customType: a.customType || '',
      startDate: a.startDate.split('T')[0],
      expiryDate: a.expiryDate.split('T')[0],
      amount: a.amount.toString(),
      paymentStatus: a.paymentStatus,
      notes: a.notes || '',
    })
    setModalOpen(true)
  }

  const openRenew = (a: any) => {
    setRenewModal(a)
    // Default: extend by 1 year from current expiry
    const currentExpiry = new Date(a.expiryDate)
    const newExpiry = new Date(currentExpiry)
    newExpiry.setFullYear(newExpiry.getFullYear() + 1)
    setRenewForm({
      startDate: currentExpiry.toISOString().split('T')[0],
      expiryDate: newExpiry.toISOString().split('T')[0],
      paymentStatus: 'PAID',
    })
  }

  const handleSave = async () => {
    if (!form.clientId || !form.amcType || !form.startDate || !form.expiryDate || !form.amount) return
    setSaving(true)
    setError('')
    try {
      if (editAmc) {
        await api.put(`/api/amc/${editAmc.id}`, form)
      } else {
        await api.post('/api/amc', form)
      }
      setModalOpen(false)
      load()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleRenew = async () => {
    if (!renewModal || !renewForm.expiryDate) return
    setSaving(true)
    try {
      await api.put(`/api/amc/${renewModal.id}`, { ...renewForm, action: 'renew' })
      setRenewModal(null)
      load()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/api/amc/${deleteId}`)
      setDeleteId(null)
      load()
    } catch (e: any) { setError(e.message) }
  }

  const pages = Math.ceil(total / limit)

  return (
    <div className="p-6">
      <PageHeader
        title="AMC Contracts"
        description={`${total} contracts tracked`}
        action={<Button icon={Plus} onClick={openAdd}>Add AMC</Button>}
      />

      {error && <div className="mb-4"><AlertBanner type="error" message={error} /></div>}

      <Card>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search AMC contracts…"
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
            />
          </div>
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition',
                  statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700')}>
                {s || 'All Status'}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {PAYMENT_FILTERS.map(p => (
              <button key={p} onClick={() => { setPaymentFilter(p); setPage(1) }}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition',
                  paymentFilter === p ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700')}>
                {p || 'All Payment'}
              </button>
            ))}
          </div>
        </div>

        {loading ? <LoadingPage /> : amcs.length === 0 ? (
          <EmptyState icon={FileText} title="No AMC contracts found" description="Start tracking your maintenance contracts." action={<Button icon={Plus} onClick={openAdd}>Add AMC</Button>} />
        ) : (
          <Table>
            <thead className="bg-slate-50/60 dark:bg-slate-800/40">
              <tr>
                <Th>Client</Th>
                <Th>AMC Type</Th>
                <Th>Start Date</Th>
                <Th>Expiry Date</Th>
                <Th>Days Left</Th>
                <Th>Amount</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {amcs.map(a => {
                const days = getDaysUntilExpiry(a.expiryDate)
                return (
                  <Tr key={a.id}>
                    <Td>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{a.client.name}</p>
                        {a.client.companyName && <p className="text-xs text-slate-400">{a.client.companyName}</p>}
                      </div>
                    </Td>
                    <Td>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {a.amcType === 'CUSTOM' && a.customType ? a.customType : formatAmcType(a.amcType)}
                      </span>
                    </Td>
                    <Td><span className="text-slate-500 text-xs">{formatDate(a.startDate)}</span></Td>
                    <Td><span className="text-slate-600 dark:text-slate-400 text-xs">{formatDate(a.expiryDate)}</span></Td>
                    <Td>
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                        days <= 0 ? 'text-red-600 bg-red-50 dark:bg-red-500/10' :
                        days <= 7 ? 'text-red-600 bg-red-50 dark:bg-red-500/10' :
                        days <= 30 ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10' :
                        'text-green-600 bg-green-50 dark:bg-green-500/10')}>
                        {days <= 0 ? 'Expired' : `${days}d`}
                      </span>
                    </Td>
                    <Td><span className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(a.amount)}</span></Td>
                    <Td><StatusBadge status={a.paymentStatus} /></Td>
                    <Td><StatusBadge status={a.status} /></Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => openRenew(a)} title="Renew" />
                        <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(a)} />
                        <Button variant="ghost" size="sm" icon={Trash2}
                          className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          onClick={() => setDeleteId(a.id)} />
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editAmc ? 'Edit AMC Contract' : 'Add AMC Contract'} size="lg">
        <div className="space-y-4">
          {error && <AlertBanner type="error" message={error} />}

          <FormField label="Client" required>
            <Select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
              <option value="">Select a client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.companyName ? ` (${c.companyName})` : ''}</option>)}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="AMC Type" required>
              <Select value={form.amcType} onChange={e => setForm(f => ({ ...f, amcType: e.target.value }))}>
                {AMC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </FormField>
            {form.amcType === 'CUSTOM' && (
              <FormField label="Custom Type Name">
                <Input value={form.customType} onChange={e => setForm(f => ({ ...f, customType: e.target.value }))} placeholder="e.g. App Maintenance" />
              </FormField>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date" required>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </FormField>
            <FormField label="Expiry Date" required>
              <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount (₹)" required>
              <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="12000" />
            </FormField>
            <FormField label="Payment Status">
              <Select value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Notes">
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Contract details, scope of work…" />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editAmc ? 'Save Changes' : 'Add Contract'}</Button>
          </div>
        </div>
      </Modal>

      {/* Renew Modal */}
      <Modal open={!!renewModal} onClose={() => setRenewModal(null)} title="Renew AMC Contract" size="sm">
        <div className="space-y-4">
          {renewModal && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm">
              <p className="font-medium text-slate-800 dark:text-slate-200">{formatAmcType(renewModal.amcType)}</p>
              <p className="text-slate-500 text-xs mt-0.5">{renewModal.client?.name}</p>
            </div>
          )}
          <FormField label="New Start Date">
            <Input type="date" value={renewForm.startDate} onChange={e => setRenewForm(f => ({ ...f, startDate: e.target.value }))} />
          </FormField>
          <FormField label="New Expiry Date" required>
            <Input type="date" value={renewForm.expiryDate} onChange={e => setRenewForm(f => ({ ...f, expiryDate: e.target.value }))} />
          </FormField>
          <FormField label="Payment Status">
            <Select value={renewForm.paymentStatus} onChange={e => setRenewForm(f => ({ ...f, paymentStatus: e.target.value }))}>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setRenewModal(null)}>Cancel</Button>
            <Button icon={RefreshCw} onClick={handleRenew} loading={saving}>Renew Contract</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete AMC Contract" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
          Are you sure you want to delete this AMC contract? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
