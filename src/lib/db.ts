import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  // Check if using Turso (libsql:// URL)
  const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL
  
  if (tursoDatabaseUrl?.startsWith('libsql://')) {
    // Turso configuration
    const libsql = createClient({
      url: tursoDatabaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    
    const adapter = new PrismaLibSql(libsql)
    
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
  }
  
  // Local SQLite configuration - use DATABASE_URL if provided
  const databaseUrl = process.env.DATABASE_URL
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl || 'file:./prisma/dev.db',
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
