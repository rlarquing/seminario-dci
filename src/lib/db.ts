import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import path from 'path'

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
  let databaseUrl = process.env.DATABASE_URL
  
  // Convert relative file path to absolute path with forward slashes for cross-platform compatibility
  if (databaseUrl?.startsWith('file:./')) {
    const relativePath = databaseUrl.replace('file:', '')
    const absolutePath = path.resolve(relativePath)
    // Normalize to forward slashes for SQLite URL compatibility on all platforms
    const normalizedPath = absolutePath.replace(/\\/g, '/')
    databaseUrl = `file:${normalizedPath}`
  }
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl || `file:${path.resolve('./prisma/dev.db').replace(/\\/g, '/')}`,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })
}

let prisma: PrismaClient

export function getDb() {
  if (!prisma) {
    prisma = globalForPrisma.prisma || createPrismaClient()
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma
    }
  }
  return prisma
}

// For backwards compatibility, but new code should use getDb()
export const db = getDb()
