/* eslint-disable @typescript-eslint/no-require-imports */
import { PrismaClient } from '@prisma/client'

// Database configuration for both environments:
// - DEVELOPMENT: Uses DATABASE_URL (SQLite local file)
// - PRODUCTION (Vercel + Turso): Uses TURSO_DATABASE_URL + TURSO_AUTH_TOKEN

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  // Check for Turso (Vercel production)
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_DB_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl?.startsWith('libsql://') && tursoToken) {
    console.log('🔌 [PRODUCTION] Connecting to Turso:', tursoUrl)

    // Dynamic require for Turso adapter (only loads when needed)
    const { PrismaLibSql } = require('@prisma/adapter-libsql')
    const { createClient } = require('@libsql/client')

    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    })

    const adapter = new PrismaLibSql(libsql)

    return new PrismaClient({
      adapter,
      log: ['error'],
    })
  }

  // Local SQLite (Development)
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  console.log('📁 [DEVELOPMENT] Connecting to SQLite:', databaseUrl)

  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
    log: ['query', 'error', 'warn'],
  })
}

// Singleton pattern for PrismaClient
let prisma: PrismaClient | undefined

export function getDb(): PrismaClient {
  if (!prisma) {
    prisma = globalForPrisma.prisma || createPrismaClient()

    // Save to global in development to prevent hot-reload issues
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma
    }
  }

  return prisma
}

// Export singleton instance
export const db = getDb()
