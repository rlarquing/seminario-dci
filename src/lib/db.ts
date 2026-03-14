/* eslint-disable @typescript-eslint/no-require-imports */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Check if we're in Turso production mode
const isTursoProduction = 
  (process.env.TURSO_DATABASE_URL?.startsWith('libsql://') || 
   process.env.TURSO_DB_URL?.startsWith('libsql://')) && 
  process.env.TURSO_AUTH_TOKEN

function createPrismaClient(): PrismaClient {
  if (isTursoProduction) {
    console.log('🔌 [PRODUCTION] Using Turso with Prisma adapter')
    
    const { PrismaLibSql } = require('@prisma/adapter-libsql')
    const { createClient } = require('@libsql/client')

    const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_DB_URL
    const tursoToken = process.env.TURSO_AUTH_TOKEN

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
  
  // Local SQLite
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  console.log('📁 [DEVELOPMENT] Using SQLite:', databaseUrl)

  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
    log: ['query', 'error', 'warn'],
  })
}

let prisma: PrismaClient | undefined

export function getDb(): PrismaClient {
  if (!prisma) {
    prisma = globalForPrisma.prisma || createPrismaClient()

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma
    }
  }

  return prisma
}

export const db = getDb()
