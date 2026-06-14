import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { formatDate, formatAmcType, generateCSV } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'clients'

  let csv = ''
  let filename = ''

  if (type === 'clients') {
    const clients = await prisma.client.findMany({
      include: { _count: { select: { domains: true, amcContracts: true } } },
      orderBy: { createdAt: 'desc' },
    })
    csv = generateCSV(
      ['Name', 'Company', 'Email', 'Phone', 'Domains', 'AMC Contracts', 'Created'],
      clients.map((c: any) => [c.name, c.companyName, c.email, c.phone, c._count.domains, c._count.amcContracts, formatDate(c.createdAt)])
    )
    filename = 'clients.csv'
  } else if (type === 'domains') {
    const domains = await prisma.domain.findMany({
      include: { client: { select: { name: true, companyName: true } } },
      orderBy: { expiryDate: 'asc' },
    })
    csv = generateCSV(
      ['Domain', 'Client', 'Company', 'Registrar', 'Expiry Date', 'Status', 'Auto Renew', 'Cost'],
      domains.map((d: any) => [
        d.domainName, d.client.name, d.client.companyName, d.registrar,
        formatDate(d.expiryDate), d.status, d.autoRenew ? 'Yes' : 'No', d.domainCost
      ])
    )
    filename = 'domains.csv'
  } else if (type === 'amc') {
    const amcs = await prisma.amcContract.findMany({
      include: { client: { select: { name: true, companyName: true } } },
      orderBy: { expiryDate: 'asc' },
    })
    csv = generateCSV(
      ['Client', 'Company', 'AMC Type', 'Start Date', 'Expiry Date', 'Amount', 'Payment Status', 'Status'],
      amcs.map((a: any) => [
        a.client.name, a.client.companyName, formatAmcType(a.amcType),
        formatDate(a.startDate), formatDate(a.expiryDate),
        a.amount, a.paymentStatus, a.status
      ])
    )
    filename = 'amc-contracts.csv'
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
