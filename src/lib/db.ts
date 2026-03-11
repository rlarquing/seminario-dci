import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  // Prioridad de configuración:
  // 1. TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (Turso/Vercel)
  // 2. DATABASE_URL (puede ser SQLite local o Turso)
  // 3. SQLite local por defecto
  
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  const databaseUrl = process.env.DATABASE_URL
  
  // Si hay configuración de Turso, usarla
  if (tursoUrl?.startsWith('libsql://') && tursoToken) {
    console.log('🔌 Usando Turso (TURSO_DATABASE_URL)')
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    })
    
    const adapter = new PrismaLibSql(libsql)
    
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : [],
    })
  }
  
  // Si DATABASE_URL es de Turso
  if (databaseUrl?.startsWith('libsql://')) {
    const authToken = process.env.TURSO_AUTH_TOKEN
    
    if (!authToken) {
      console.warn('⚠️ DATABASE_URL es de Turso pero falta TURSO_AUTH_TOKEN')
    } else {
      console.log('🔌 Usando Turso (DATABASE_URL)')
      const libsql = createClient({
        url: databaseUrl,
        authToken: authToken,
      })
      
      const adapter = new PrismaLibSql(libsql)
      
      return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : [],
      })
    }
  }
  
  // SQLite local (desarrollo)
  console.log('📁 Usando SQLite local')
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : [],
  })
}

export const db = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
