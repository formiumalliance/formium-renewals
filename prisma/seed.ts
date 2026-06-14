import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default admin
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'hello@formium.in' },
    update: {},
    create: {
      name: 'Admin',
      email: 'hello@formium.in',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })
  console.log(`✅ Admin user: ${admin.email} (password: admin123)`)

  // Create default notification config
  await prisma.notificationConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      adminEmail: 'hello@formium.in',
      additionalEmails: [],
      domainAlerts: true,
      amcAlerts: true,
      systemAlerts: true,
    },
  }).catch(() => {
    // If id-based upsert fails, just create if doesn't exist
    return prisma.notificationConfig.findFirst().then((existing: any) => {
      if (!existing) {
        return prisma.notificationConfig.create({
          data: {
            adminEmail: 'hello@formium.in',
            additionalEmails: [],
            domainAlerts: true,
            amcAlerts: true,
            systemAlerts: true,
          },
        })
      }
    })
  })
  console.log('✅ Default notification config created')

  // Default system settings
  const defaultSettings = [
    { key: 'currency', value: 'INR' },
    { key: 'currencyPosition', value: 'before' },
    { key: 'timezone', value: 'Asia/Kolkata' },
    { key: 'dateFormat', value: 'DD/MM/YYYY' },
  ]

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }
  console.log('✅ Default system settings created')

  // Create a sample client with domain and AMC for demo
  const sampleClient = await prisma.client.upsert({
    where: { id: 'sample-client-1' },
    update: {},
    create: {
      id: 'sample-client-1',
      name: 'Sample Client',
      companyName: 'Sample Corp Pvt Ltd',
      email: 'client@sample.com',
      phone: '+91 98765 43210',
      notes: 'Demo client for testing',
    },
  })
  console.log(`✅ Sample client: ${sampleClient.name}`)

  // Sample domain expiring in 15 days
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 15)
  
  await prisma.domain.upsert({
    where: { id: 'sample-domain-1' },
    update: {},
    create: {
      id: 'sample-domain-1',
      clientId: sampleClient.id,
      domainName: 'samplecorp.com',
      registrar: 'GoDaddy',
      expiryDate: futureDate,
      autoRenew: false,
      domainCost: 999,
      status: 'EXPIRING_SOON',
    },
  })
  console.log('✅ Sample domain created')

  // Sample AMC expiring in 30 days
  const amcExpiry = new Date()
  amcExpiry.setDate(amcExpiry.getDate() + 30)
  const amcStart = new Date()
  amcStart.setFullYear(amcStart.getFullYear() - 1)

  await prisma.amcContract.upsert({
    where: { id: 'sample-amc-1' },
    update: {},
    create: {
      id: 'sample-amc-1',
      clientId: sampleClient.id,
      amcType: 'WEBSITE_MAINTENANCE',
      startDate: amcStart,
      expiryDate: amcExpiry,
      amount: 24000,
      paymentStatus: 'PAID',
      status: 'EXPIRING_SOON',
      notes: 'Annual website maintenance contract',
    },
  })
  console.log('✅ Sample AMC contract created')

  console.log('\n🎉 Seed complete!')
  console.log('\n📧 Login credentials:')
  console.log('   Email: hello@formium.in')
  console.log('   Password: admin123')
  console.log('\n⚠️  IMPORTANT: Change the password after first login!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
