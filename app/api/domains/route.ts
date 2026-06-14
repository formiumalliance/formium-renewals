import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getDomainStatus } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const clientId = searchParams.get('clientId') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { domainName: { contains: search, mode: 'insensitive' } },
      { registrar: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status) where.status = status
  if (clientId) where.clientId = clientId

  const [domains, total] = await Promise.all([
    prisma.domain.findMany({
      where,
      include: { client: { select: { id: true, name: true, companyName: true } } },
      orderBy: { expiryDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.domain.count({ where }),
  ])

  return NextResponse.json({ domains, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { clientId, domainName, registrar, purchaseDate, creationDate, expiryDate, autoRenew, domainCost, loginUrl, notes } = body

  if (!clientId || !domainName || !expiryDate) {
    return NextResponse.json({ error: 'clientId, domainName, and expiryDate are required' }, { status: 400 })
  }

  const status = getDomainStatus(expiryDate)

  const domain = await prisma.domain.create({
    data: {
      clientId,
      domainName,
      registrar,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      creationDate: creationDate ? new Date(creationDate) : null,
      expiryDate: new Date(expiryDate),
      autoRenew: autoRenew || false,
      domainCost: domainCost ? parseFloat(domainCost) : null,
      loginUrl,
      notes,
      status,
    },
    include: { client: { select: { id: true, name: true } } },
  })

  // Activity log
  await prisma.activityLog.create({
    data: {
      clientId,
      activityType: 'DOMAIN_ADDED',
      description: `Domain ${domainName} added`,
    },
  })

  return NextResponse.json(domain, { status: 201 })
}
