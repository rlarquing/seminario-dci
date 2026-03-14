import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  // Turso configuration (Vercel production)
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  
  // Check for Turso first (Vercel sets TURSO_DATABASE_URL automatically)
  if (tursoUrl?.startsWith('libsql://') && tursoToken) {
    console.log('🔌 Connecting to Turso:', tursoUrl)
    
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    })
    
    const adapter = new PrismaLibSQL(libsql)
    
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  
  // Local SQLite configuration
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  console.log('📁 Connecting to SQLite:', databaseUrl)
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
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

// Export for convenience
export const db = getDb()
