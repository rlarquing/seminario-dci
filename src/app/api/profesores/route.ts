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

// GET - Listar profesores activos (por defecto)
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
      if (onlyDeleted) {
        where.activo = false
      } else if (!includeDeleted) {
        where.activo = true
      }
      
      const profesores = await db.profesor.findMany({
        where,
        orderBy: { id: 'asc' },
        include: {
          asignatura: true
        }
      })
      return NextResponse.json(profesores)
    }
    
    // Turso production
    let sql = `SELECT p.*, a.nombre as asignaturaNombre, a.codigo as asignaturaCodigo
      FROM profesores p
      LEFT JOIN asignaturas a ON p.asignaturaId = a.id`
    
    if (onlyDeleted) {
      sql += ' WHERE p.activo = 0'
    } else if (!includeDeleted) {
      sql += ' WHERE p.activo = 1'
    }
    sql += ' ORDER BY p.id ASC'
    
    const result = await client.execute(sql)
    return NextResponse.json(result.rows.map(row => ({
      ...row,
      tomaHuellaBiometrica: !!row.tomaHuellaBiometrica,
      entregaFoto: !!row.entregaFoto,
      asignatura: row.asignaturaId ? {
        id: row.asignaturaId,
        nombre: row.asignaturaNombre,
        codigo: row.asignaturaCodigo
      } : null
    })))
  } catch (error) {
    console.error('Error fetching profesores:', error)
    return NextResponse.json({ error: 'Error al obtener profesores' }, { status: 500 })
  }
}

// POST - Crear nuevo profesor
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const client = getTursoClient()
    const asignaturaId = data.asignaturaId ? parseInt(data.asignaturaId) : null
    
    if (!client) {
      // Local development with Prisma
      const db = getDb()
      
      const profesor = await db.profesor.create({
        data: {
          nombre: data.nombre,
          ci: data.ci,
          telefono: data.telefono || null,
          email: data.email || null,
          genero: data.genero || null,
          nombreIglesia: data.nombreIglesia || null,
          nombrePastor: data.nombrePastor || null,
          tomaHuellaBiometrica: data.tomaHuellaBiometrica || false,
          entregaFoto: data.entregaFoto || false,
          asignaturaId: asignaturaId,
        }
      })
      
      return NextResponse.json(profesor)
    }
    
    // Turso production - Check if exists
    const existing = await client.execute({
      sql: 'SELECT * FROM profesores WHERE ci = ?',
      args: [data.ci]
    })
    
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Ya existe un profesor con ese carnet de identidad' }, { status: 409 })
    }
    
    // Create new profesor
    const result = await client.execute({
      sql: `INSERT INTO profesores (
        nombre, ci, telefono, email, genero, nombreIglesia, nombrePastor,
        tomaHuellaBiometrica, entregaFoto, asignaturaId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.nombre,
        data.ci,
        data.telefono || null,
        data.email || null,
        data.genero || null,
        data.nombreIglesia || null,
        data.nombrePastor || null,
        data.tomaHuellaBiometrica ? 1 : 0,
        data.entregaFoto ? 1 : 0,
        asignaturaId
      ]
    })
    
    // Get the created row
    const newProfesor = await client.execute({
      sql: 'SELECT * FROM profesores WHERE id = ?',
      args: [result.lastInsertRowid]
    })
    
    return NextResponse.json(newProfesor.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating profesor:', error)
    return NextResponse.json({ error: 'Error al crear profesor' }, { status: 500 })
  }
}