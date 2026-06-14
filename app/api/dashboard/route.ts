import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { addDays, startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const now = new Date()
  const in7 = addDays(now, 7)
  const in15 = addDays(now, 15)
  const in30 = addDays(now, 30)

  const [
    totalClients,
    activeDomains,
    domainsExp7,
    domainsExp15,
    domainsExp30,
    expiredDomains,
    activeAmcs,
    amcsExp7,
    amcsExp15,
    amcsExp30,
    expiredAmcs,
    allAmcs,
    recentDomainAlerts,
    recentAmcAlerts,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.domain.count({ where: { status: 'ACTIVE' } }),
    prisma.domain.count({ where: { expiryDate: { gte: now, lte: in7 } } }),
    prisma.domain.count({ where: { expiryDate: { gte: now, lte: in15 } } }),
    prisma.domain.count({ where: { expiryDate: { gte: now, lte: in30 } } }),
    prisma.domain.count({ where: { status: 'EXPIRED' } }),
    prisma.amcContract.count({ where: { status: 'ACTIVE' } }),
    prisma.amcContract.count({ where: { expiryDate: { gte: now, lte: in7 } } }),
    prisma.amcContract.count({ where: { expiryDate: { gte: now, lte: in15 } } }),
    prisma.amcContract.count({ where: { expiryDate: { gte: now, lte: in30 } } }),
    prisma.amcContract.count({ where: { status: 'EXPIRED' } }),
    prisma.amcContract.findMany({ select: { amount: true, startDate: true, expiryDate: true, status: true } }),
    prisma.domain.findMany({
      where: { expiryDate: { gte: now, lte: in30 } },
      include: { client: { select: { name: true, companyName: true } } },
      orderBy: { expiryDate: 'asc' },
      take: 10,
    }),
    prisma.amcContract.findMany({
      where: { expiryDate: { gte: now, lte: in30 } },
      include: { client: { select: { name: true, companyName: true } } },
      orderBy: { expiryDate: 'asc' },
      take: 10,
    }),
  ])

  // Revenue calculations
  const totalAmcRevenue = allAmcs.reduce((sum: number, a: any) => sum + a.amount, 0)
  const monthlyAmcRevenue = allAmcs
    .filter((a: any) => {
      const s = startOfMonth(now)
      const e = endOfMonth(now)
      return a.startDate >= s && a.startDate <= e
    })
    .reduce((sum: number, a: any) => sum + a.amount, 0)

  // Monthly revenue chart - last 6 months
  const monthlyRevenue = []
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i)
    const s = startOfMonth(monthDate)
    const e = endOfMonth(monthDate)
    const revenue = allAmcs
      .filter((a: any) => a.startDate >= s && a.startDate <= e)
      .reduce((sum: number, a: any) => sum + a.amount, 0)
    monthlyRevenue.push({ month: format(monthDate, 'MMM yyyy'), revenue })
  }

  return NextResponse.json({
    kpis: {
      totalClients,
      activeDomains,
      domainsExp7,
      domainsExp15,
      domainsExp30,
      expiredDomains,
      activeAmcs,
      amcsExp7,
      amcsExp15,
      amcsExp30,
      expiredAmcs,
      totalAmcRevenue,
      monthlyAmcRevenue,
    },
    alerts: {
      domains: recentDomainAlerts,
      amcs: recentAmcAlerts,
    },
    charts: {
      monthlyRevenue,
    },
  })
}
