import nodemailer from 'nodemailer'
import { prisma } from './prisma'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
}

async function sendViaSMTP(options: EmailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: `"${process.env.SENDGRID_FROM_NAME || 'AMC Dashboard'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    html: options.html,
  })
}

async function sendViaSendGrid(options: EmailOptions) {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) throw new Error('SendGrid API key not configured')

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: Array.isArray(options.to)
          ? options.to.map(email => ({ email }))
          : [{ email: options.to }],
      }],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'hello@formium.in',
        name: process.env.SENDGRID_FROM_NAME || 'AMC Dashboard',
      },
      subject: options.subject,
      content: [{ type: 'text/html', value: options.html }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SendGrid error: ${error}`)
  }
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.SENDGRID_API_KEY) {
      await sendViaSendGrid(options)
    } else {
      await sendViaSMTP(options)
    }
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    // Try SMTP fallback if SendGrid fails
    if (process.env.SENDGRID_API_KEY && process.env.SMTP_USER) {
      try {
        await sendViaSMTP(options)
        return { success: true }
      } catch (smtpError) {
        return { success: false, error: message }
      }
    }
    return { success: false, error: message }
  }
}

// Email Templates
export function getDomainExpiryTemplate(data: {
  clientName: string
  domainName: string
  expiryDate: string
  daysRemaining: number
  companyName?: string
}): { subject: string; html: string } {
  const urgency = data.daysRemaining <= 7 ? 'URGENT: ' : data.daysRemaining <= 15 ? 'IMPORTANT: ' : ''
  const subject = `${urgency}Domain Expiry Reminder - ${data.domainName} expires in ${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Domain Expiry Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">AMC Dashboard</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Domain Management Alert</p>
            </td>
          </tr>
          <!-- Alert Badge -->
          <tr>
            <td style="padding:32px 40px 0;">
              <div style="display:inline-block;background:${data.daysRemaining <= 7 ? '#fee2e2' : data.daysRemaining <= 15 ? '#fef3c7' : '#e0f2fe'};color:${data.daysRemaining <= 7 ? '#dc2626' : data.daysRemaining <= 15 ? '#d97706' : '#0284c7'};padding:6px 16px;border-radius:100px;font-size:13px;font-weight:600;">
                ⚠️ Expires in ${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:24px 40px;">
              <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:600;">Domain Expiry Notice</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                Hello ${data.clientName}, this is a reminder that the following domain is expiring soon.
              </p>
              <!-- Domain Card -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="color:#94a3b8;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Domain Name</span>
                      <p style="margin:4px 0 0;color:#0f172a;font-size:16px;font-weight:600;">${data.domainName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="color:#94a3b8;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Expiry Date</span>
                      <p style="margin:4px 0 0;color:#0f172a;font-size:15px;font-weight:500;">${data.expiryDate}</p>
                    </td>
                  </tr>
                  ${data.companyName ? `
                  <tr>
                    <td style="padding:6px 0;">
                      <span style="color:#94a3b8;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Company</span>
                      <p style="margin:4px 0 0;color:#0f172a;font-size:15px;">${data.companyName}</p>
                    </td>
                  </tr>` : ''}
                </table>
              </div>
              <!-- CTA -->
              <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
                Please renew your domain before the expiry date to avoid service interruption. Contact your agency to initiate the renewal process.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated reminder from AMC Dashboard. © ${new Date().getFullYear()} Formium Agency.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}

export function getAmcExpiryTemplate(data: {
  clientName: string
  amcType: string
  expiryDate: string
  daysRemaining: number
  amount: number
  companyName?: string
}): { subject: string; html: string } {
  const urgency = data.daysRemaining <= 7 ? 'URGENT: ' : data.daysRemaining <= 15 ? 'IMPORTANT: ' : ''
  const subject = `${urgency}AMC Renewal Reminder - ${data.amcType} expires in ${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AMC Renewal Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">AMC Dashboard</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Annual Maintenance Contract Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;">
              <div style="display:inline-block;background:${data.daysRemaining <= 7 ? '#fee2e2' : data.daysRemaining <= 15 ? '#fef3c7' : '#e0f2fe'};color:${data.daysRemaining <= 7 ? '#dc2626' : data.daysRemaining <= 15 ? '#d97706' : '#0284c7'};padding:6px 16px;border-radius:100px;font-size:13px;font-weight:600;">
                ⚠️ Expires in ${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;">
              <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:600;">AMC Renewal Notice</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                Hello ${data.clientName}, your Annual Maintenance Contract is expiring soon. Please arrange for renewal.
              </p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:6px 0;">
                    <span style="color:#94a3b8;font-size:12px;font-weight:500;text-transform:uppercase;">Service Type</span>
                    <p style="margin:4px 0 0;color:#0f172a;font-size:16px;font-weight:600;">${data.amcType}</p>
                  </td></tr>
                  <tr><td style="padding:6px 0;">
                    <span style="color:#94a3b8;font-size:12px;font-weight:500;text-transform:uppercase;">Expiry Date</span>
                    <p style="margin:4px 0 0;color:#0f172a;font-size:15px;font-weight:500;">${data.expiryDate}</p>
                  </td></tr>
                  <tr><td style="padding:6px 0;">
                    <span style="color:#94a3b8;font-size:12px;font-weight:500;text-transform:uppercase;">Renewal Amount</span>
                    <p style="margin:4px 0 0;color:#0f172a;font-size:15px;font-weight:500;">₹${data.amount.toLocaleString()}</p>
                  </td></tr>
                </table>
              </div>
              <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
                To renew your contract or for any queries, please contact your account manager.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated reminder from AMC Dashboard. © ${new Date().getFullYear()} Formium Agency.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}
