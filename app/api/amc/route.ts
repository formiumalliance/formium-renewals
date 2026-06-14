import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getAmcStatus } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const paymentStatus = searchParams.get('paymentStatus') || ''
  const clientId = searchParams.get('clientId') || ''
  const amcType = searchParams.get('amcType') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { customType: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { client: { companyName: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (status) where.status = status
  if (paymentStatus) where.paymentStatus = paymentStatus
  if (clientId) where.clientId = clientId
  if (amcType) where.amcType = amcType

  const [amcs, total] = await Promise.all([
    prisma.amcContract.findMany({
      where,
      include: { client: { select: { id: true, name: true, companyName: true } } },
      orderBy: { expiryDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.amcContract.count({ where }),
  ])

  return NextResponse.json({ amcs, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { clientId, amcType, customType, startDate, expiryDate, amount, paymentStatus, notes } = body

  if (!clientId || !amcType || !startDate || !expiryDate || amount === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const status = getAmcStatus(expiryDate)

  const amc = await prisma.amcContract.create({
    data: {
      clientId,
      amcType,
      customType,
      startDate: new Date(startDate),
      expiryDate: new Date(expiryDate),
      amount: parseFloat(amount),
      paymentStatus: paymentStatus || 'PENDING',
      notes,
      status,
    },
    include: { client: { select: { id: true, name: true } } },
  })

  await prisma.activityLog.create({
    data: {
      clientId,
      activityType: 'AMC_ADDED',
      description: `AMC contract (${amcType}) added`,
    },
  })

  return NextResponse.json(amc, { status: 201 })
}
