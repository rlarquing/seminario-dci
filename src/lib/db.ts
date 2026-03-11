import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  // Check if using Turso (libsql:// URL)
  const databaseUrl = process.env.DATABASE_URL
  
  if (databaseUrl?.startsWith('libsql://')) {
    // Turso configuration
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    
    const adapter = new PrismaLibSql(libsql)
    
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
  }
  
  // Local SQLite configuration
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
