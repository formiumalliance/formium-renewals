import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  let config = await prisma.notificationConfig.findFirst()
  if (!config) {
    config = await prisma.notificationConfig.create({
      data: { adminEmail: 'hello@formium.in' },
    })
  }
  return NextResponse.json(config)
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { adminEmail, additionalEmails, domainAlerts, amcAlerts, systemAlerts } = body

  let config = await prisma.notificationConfig.findFirst()
  if (!config) {
    config = await prisma.notificationConfig.create({ data: { adminEmail: adminEmail || 'hello@formium.in' } })
  }

  const updated = await prisma.notificationConfig.update({
    where: { id: config.id },
    data: {
      adminEmail: adminEmail || config.adminEmail,
      additionalEmails: additionalEmails || config.additionalEmails,
      domainAlerts: domainAlerts ?? config.domainAlerts,
      amcAlerts: amcAlerts ?? config.amcAlerts,
      systemAlerts: systemAlerts ?? config.systemAlerts,
    },
  })

  return NextResponse.json(updated)
}
