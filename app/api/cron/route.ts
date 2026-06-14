import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, getDomainExpiryTemplate, getAmcExpiryTemplate } from '@/lib/email'
import { getDaysUntilExpiry, formatDate, formatAmcType } from '@/lib/utils'
import { getDomainStatus, getAmcStatus } from '@/lib/utils'

const REMINDER_DAYS = [30, 15, 7, 0]

function getEmailType(days: number, prefix: 'DOMAIN' | 'AMC') {
  if (days <= 0) return `${prefix}_EXPIRED`
  if (days <= 7) return `${prefix}_EXPIRY_7`
  if (days <= 15) return `${prefix}_EXPIRY_15`
  return `${prefix}_EXPIRY_30`
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { domainsChecked: 0, amcsChecked: 0, emailsSent: 0, emailsFailed: 0 }

  // Get notification config
  const notifConfig = await prisma.notificationConfig.findFirst()
  const adminEmail = notifConfig?.adminEmail || 'hello@formium.in'
  const additionalEmails = notifConfig?.additionalEmails || []

  // ============ DOMAINS ============
  if (notifConfig?.domainAlerts !== false) {
    const domains = await prisma.domain.findMany({
      include: { client: { select: { name: true, companyName: true, email: true } } },
    })

    for (const domain of domains) {
      results.domainsChecked++
      const days = getDaysUntilExpiry(domain.expiryDate)

      // Check if this is a reminder day
      const isReminderDay = REMINDER_DAYS.some(d => days === d) || days < 0 && days >= -1
      if (!isReminderDay) continue

      const emailType = getEmailType(days, 'DOMAIN') as any

      // Check if already sent today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const alreadySent = await prisma.emailLog.findFirst({
        where: {
          domainId: domain.id,
          emailType,
          sentAt: { gte: today },
          status: 'SENT',
        },
      })
      if (alreadySent) continue

      // Update domain status
      const newStatus = getDomainStatus(domain.expiryDate)
      if (newStatus !== domain.status) {
        await prisma.domain.update({ where: { id: domain.id }, data: { status: newStatus } })
      }

      // Prepare recipients
      const recipients = [adminEmail, ...additionalEmails]
      if (domain.client.email) recipients.push(domain.client.email)
      const uniqueRecipients = [...new Set(recipients)].filter(Boolean)

      const { subject, html } = getDomainExpiryTemplate({
        clientName: domain.client.name,
        domainName: domain.domainName,
        expiryDate: formatDate(domain.expiryDate),
        daysRemaining: Math.max(0, days),
        companyName: domain.client.companyName || undefined,
      })

      for (const recipient of uniqueRecipients) {
        const { success, error } = await sendEmail({ to: recipient, subject, html })

        await prisma.emailLog.create({
          data: {
            emailType,
            status: success ? 'SENT' : 'FAILED',
            recipient,
            subject,
            domainId: domain.id,
            errorMessage: error || null,
          },
        })

        if (success) results.emailsSent++
        else results.emailsFailed++
      }
    }
  }

  // ============ AMC ============
  if (notifConfig?.amcAlerts !== false) {
    const amcs = await prisma.amcContract.findMany({
      include: { client: { select: { name: true, companyName: true, email: true } } },
    })

    for (const amc of amcs) {
      results.amcsChecked++
      const days = getDaysUntilExpiry(amc.expiryDate)

      const isReminderDay = REMINDER_DAYS.some(d => days === d) || days < 0 && days >= -1
      if (!isReminderDay) continue

      const emailType = getEmailType(days, 'AMC') as any

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const alreadySent = await prisma.emailLog.findFirst({
        where: {
          amcContractId: amc.id,
          emailType,
          sentAt: { gte: today },
          status: 'SENT',
        },
      })
      if (alreadySent) continue

      const newStatus = getAmcStatus(amc.expiryDate)
      if (newStatus !== amc.status) {
        await prisma.amcContract.update({ where: { id: amc.id }, data: { status: newStatus } })
      }

      const recipients = [adminEmail, ...additionalEmails]
      if (amc.client.email) recipients.push(amc.client.email)
      const uniqueRecipients = [...new Set(recipients)].filter(Boolean)

      const { subject, html } = getAmcExpiryTemplate({
        clientName: amc.client.name,
        amcType: formatAmcType(amc.amcType),
        expiryDate: formatDate(amc.expiryDate),
        daysRemaining: Math.max(0, days),
        amount: amc.amount,
        companyName: amc.client.companyName || undefined,
      })

      for (const recipient of uniqueRecipients) {
        const { success, error } = await sendEmail({ to: recipient, subject, html })

        await prisma.emailLog.create({
          data: {
            emailType,
            status: success ? 'SENT' : 'FAILED',
            recipient,
            subject,
            amcContractId: amc.id,
            errorMessage: error || null,
          },
        })

        if (success) results.emailsSent++
        else results.emailsFailed++
      }
    }
  }

  return NextResponse.json({ success: true, results })
}

// Also allow GET for simple cron triggers
export async function GET(request: NextRequest) {
  return POST(request)
}
