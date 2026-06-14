import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getDomainStatus, getAmcStatus } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { companyName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        domains: { select: { id: true, domainName: true, expiryDate: true, status: true } },
        amcContracts: { select: { id: true, amcType: true, expiryDate: true, status: true, amount: true } },
        _count: { select: { domains: true, amcContracts: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.client.count({ where }),
  ])

  return NextResponse.json({ clients, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { name, companyName, email, phone, notes } = body

  if (!name) return NextResponse.json({ error: 'Client name is required' }, { status: 400 })

  const client = await prisma.client.create({
    data: { name, companyName, email, phone, notes },
  })

  return NextResponse.json(client, { status: 201 })
}
