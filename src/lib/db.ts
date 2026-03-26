/* eslint-disable @typescript-eslint/no-require-imports */
import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Check if we're in Turso production mode (Vercel)
const isTursoProduction = 
  (process.env.TURSO_DATABASE_URL?.startsWith('libsql://') || 
   process.env.TURSO_DB_URL?.startsWith('libsql://')) && 
  process.env.TURSO_AUTH_TOKEN

// Get project root directory (works on both Windows and Linux)
function getProjectRoot(): string {
  // In production (Vercel), process.cwd() returns '/var/task' or similar
  // In local development, it returns the project root
  return process.cwd()
}

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
  
  // Local development (SQLite) - always use absolute path
  // This works on both Windows and Linux by using process.cwd()
  // The path will be: /path/to/project/prisma/db/custom.db
  let databaseUrl: string
  
  if (process.env.DATABASE_URL?.startsWith('file:') && !process.env.DATABASE_URL.includes(':')) {
    // Old format without file: prefix, convert to absolute
    databaseUrl = `file:${path.join(getProjectRoot(), process.env.DATABASE_URL)}`
  } else if (process.env.DATABASE_URL?.startsWith('file:/')) {
    // Absolute path already provided (e.g., file:/absolute/path)
    databaseUrl = process.env.DATABASE_URL
  } else if (process.env.DATABASE_URL?.startsWith('file:')) {
    // Relative path in env, make it absolute
    const relativePath = process.env.DATABASE_URL.replace('file:', '')
    databaseUrl = `file:${path.join(getProjectRoot(), relativePath)}`
  } else {
    // No DATABASE_URL or it's Turso (libsql://) - use default
    databaseUrl = `file:${path.join(getProjectRoot(), 'prisma', 'db', 'custom.db')}`
  }
  
  console.log('📁 [LOCAL/DEVELOPMENT] Using SQLite:', databaseUrl)

  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

let prisma: PrismaClient | undefined

export function getDb(): PrismaClient {
  if (!prisma) {
    prisma = createPrismaClient()

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma
    }
  }

  return prisma
}

export const db = getDb()
