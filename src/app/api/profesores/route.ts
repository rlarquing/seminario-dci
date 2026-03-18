/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

// GET - Listar todos los profesores (activos por defecto)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true'
    
    const client = getTursoClient()
    
    if (!client) {
      // Local development with Prisma
      const { db } = await import('@/lib/db')
      
      const where: { activo?: boolean } = {}
      if (!includeDeleted) {
        where.activo = true
      } else if (onlyDeleted) {
        where.activo = false
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
    
    if (!includeDeleted) {
      sql += ' WHERE p.activo = 1'
    } else if (onlyDeleted) {
      sql += ' WHERE p.activo = 0'
    }
    
    sql += ' ORDER BY p.id ASC'
    
    const result = await client.execute(sql)
    
    const profesores = result.rows.map(row => ({
      ...row,
      tomaHuellaBiometrica: !!row.tomaHuellaBiometrica,
      entregaFoto: !!row.entregaFoto,
      activo: row.activo === 1 || row.activo === true,
      asignatura: row.asignaturaId ? {
        id: row.asignaturaId,
        nombre: row.asignaturaNombre,
        codigo: row.asignaturaCodigo
      } : null
    }))
    
    return NextResponse.json(profesores)
  } catch (error) {
    console.error('Error fetching profesores:', error)
    return NextResponse.json({ error: 'Error al obtener profesores' }, { status: 500 })
  }
}

// POST - Crear nuevo profesor
export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log('Creating profesor with data:', data)
    
    const client = getTursoClient()
    
    // Parse asignaturaId to integer
    const asignaturaId = data.asignaturaId ? parseInt(data.asignaturaId) : null
    
    if (!client) {
      // Local development with Prisma
      const { db } = await import('@/lib/db')
      
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
      
      console.log('Profesor created successfully:', profesor)
      return NextResponse.json(profesor)
    }
    
    // Turso production
    const result = await client.execute({
      sql: `INSERT INTO profesores (nombre, ci, telefono, email, genero, nombreIglesia, nombrePastor, 
            tomaHuellaBiometrica, entregaFoto, asignaturaId, activo, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
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
    
    // Get the created profesor
    const newId = result.lastInsertRowid
    const newProfesor = await client.execute({
      sql: 'SELECT * FROM profesores WHERE id = ?',
      args: [newId]
    })
    
    console.log('Profesor created successfully:', newProfesor.rows[0])
    return NextResponse.json(newProfesor.rows[0])
  } catch (error) {
    console.error('Error creating profesor:', error)
    return NextResponse.json({ error: 'Error al crear profesor: ' + (error instanceof Error ? error.message : 'Error desconocido') }, { status: 500 })
  }
}
