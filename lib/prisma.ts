import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// In production on shared hosting, don't cache the client globally
// to avoid the "timer has gone away" panic after engine crashes
export const prisma = global.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
