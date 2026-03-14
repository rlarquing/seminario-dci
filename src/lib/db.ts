import { PrismaClient } from '@prisma/client'

// Simple SQLite connection for development
// For production with Turso, set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

// Create PrismaClient instance
let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
    log: ['error'],
  })
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: { url: databaseUrl },
      },
      log: ['query', 'error', 'warn'],
    })
  }
  prisma = globalForPrisma.prisma
}

export const db = prisma
export function getDb() { return db }
