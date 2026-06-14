import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      include: {
        domain: { select: { domainName: true } },
        amcContract: { select: { amcType: true } },
      },
      orderBy: { sentAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.emailLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
}
