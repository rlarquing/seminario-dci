/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'

// Direct Turso client for production
function getTursoClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (!tursoUrl || !tursoToken) {
    return null
  }

  const { createClient } = require('@libsql/client')
  return createClient({
    url: tursoUrl,
    authToken: tursoToken,
  })
}

// GET - Listar asignaturas activas (por defecto)
// Params opcionales: ?includeDeleted=true | ?onlyDeleted=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true'
    
    const client = getTursoClient()
    
    if (!client) {
      // Local development with Prisma
      const db = getDb()
      
      const where: { activo?: boolean } = {}
      if (!includeDeleted) {
        where.activo = true
      } else if (onlyDeleted) {
        where.activo = false
      }
      
      const asignaturas = await db.asignatura.findMany({
        where,
        orderBy: { id: 'asc' }
      })
      return NextResponse.json(asignaturas)
    }
    
    // Turso production
    let sql = 'SELECT * FROM asignaturas'
    if (onlyDeleted) {
      sql += ' WHERE activo = 0'
    } else if (!includeDeleted) {
      sql += ' WHERE activo = 1'
    }
    sql += ' ORDER BY id ASC'
    
    const result = await client.execute(sql)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching asignaturas:', error)
    return NextResponse.json({ error: 'Error al obtener asignaturas' }, { status: 500 })
  }
}

// POST - Crear nueva asignatura
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const client = getTursoClient()
    
    if (!data.nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }
    
    if (!client) {
      // Local development with Prisma
      const db = getDb()
      
      const asignatura = await db.asignatura.create({
        data: {
          nombre: data.nombre,
          codigo: data.codigo || null,
        }
      })
      
      return NextResponse.json(asignatura)
    }
    
    // Turso production - Check if exists with same codigo
    if (data.codigo) {
      const existing = await client.execute({
        sql: 'SELECT * FROM asignaturas WHERE codigo = ?',
        args: [data.codigo]
      })
      
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Ya existe una asignatura con ese código' }, { status: 409 })
      }
    }
    
    // Create new asignatura
    const result = await client.execute({
      sql: 'INSERT INTO asignaturas (nombre, codigo) VALUES (?, ?)',
      args: [data.nombre, data.codigo || null]
    })
    
    // Get the created row
    const newAsignatura = await client.execute({
      sql: 'SELECT * FROM asignaturas WHERE id = ?',
      args: [result.lastInsertRowid]
    })
    
    return NextResponse.json(newAsignatura.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating asignatura:', error)
    return NextResponse.json({ error: 'Error al crear asignatura' }, { status: 500 })
  }
}