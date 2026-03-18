/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from 'next/server'

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

// GET - Listar todas las notas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alumnoId = searchParams.get('alumnoId')
    const client = getTursoClient()
    
    if (!client) {
      // Local development with Prisma
      const { db } = await import('@/lib/db')
      
      if (alumnoId) {
        const notas = await db.nota.findMany({
          where: { alumnoId: parseInt(alumnoId) },
          include: {
            asignatura: true
          },
          orderBy: { asignaturaId: 'asc' }
        })
        return NextResponse.json(notas)
      }
      
      const notas = await db.nota.findMany({
        include: {
          alumno: true,
          asignatura: true
        },
        orderBy: [{ alumnoId: 'asc' }, { asignaturaId: 'asc' }]
      })
      return NextResponse.json(notas)
    }
    
    // Turso production
    if (alumnoId) {
      const result = await client.execute({
        sql: `SELECT n.*, a.nombre as asignaturaNombre, a.codigo as asignaturaCodigo
              FROM notas n
              JOIN asignaturas a ON n.asignaturaId = a.id
              WHERE n.alumnoId = ?
              ORDER BY n.asignaturaId ASC`,
        args: [parseInt(alumnoId)]
      })
      
      return NextResponse.json(result.rows.map(row => ({
        id: row.id,
        nota: row.nota,
        alumnoId: row.alumnoId,
        asignaturaId: row.asignaturaId,
        asignatura: {
          id: row.asignaturaId,
          nombre: row.asignaturaNombre,
          codigo: row.asignaturaCodigo
        }
      })))
    }
    
    const result = await client.execute(`
      SELECT n.*, 
             al.nombre as alumnoNombre, al.ci as alumnoCI,
             a.nombre as asignaturaNombre, a.codigo as asignaturaCodigo
      FROM notas n
      JOIN alumnos al ON n.alumnoId = al.id
      JOIN asignaturas a ON n.asignaturaId = a.id
      ORDER BY n.alumnoId ASC, n.asignaturaId ASC
    `)
    
    return NextResponse.json(result.rows.map(row => ({
      id: row.id,
      nota: row.nota,
      alumnoId: row.alumnoId,
      asignaturaId: row.asignaturaId,
      alumno: {
        id: row.alumnoId,
        nombre: row.alumnoNombre,
        ci: row.alumnoCI
      },
      asignatura: {
        id: row.asignaturaId,
        nombre: row.asignaturaNombre,
        codigo: row.asignaturaCodigo
      }
    })))
  } catch (error) {
    console.error('Error fetching notas:', error)
    return NextResponse.json({ error: 'Error al obtener notas' }, { status: 500 })
  }
}

// POST - Crear o actualizar nota (upsert)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const client = getTursoClient()
    
    if (!client) {
      // Local development with Prisma
      const { db } = await import('@/lib/db')
      
      const nota = await db.nota.upsert({
        where: {
          alumnoId_asignaturaId: {
            alumnoId: data.alumnoId,
            asignaturaId: data.asignaturaId
          }
        },
        update: {
          nota: data.nota
        },
        create: {
          alumnoId: data.alumnoId,
          asignaturaId: data.asignaturaId,
          nota: data.nota
        },
        include: {
          asignatura: true
        }
      })
      
      return NextResponse.json(nota)
    }
    
    // Turso production - Check if exists first
    const existing = await client.execute({
      sql: 'SELECT * FROM notas WHERE alumnoId = ? AND asignaturaId = ?',
      args: [data.alumnoId, data.asignaturaId]
    })
    
    if (existing.rows.length > 0) {
      // Update
      await client.execute({
        sql: 'UPDATE notas SET nota = ?, updatedAt = CURRENT_TIMESTAMP WHERE alumnoId = ? AND asignaturaId = ?',
        args: [data.nota, data.alumnoId, data.asignaturaId]
      })
    } else {
      // Insert
      await client.execute({
        sql: 'INSERT INTO notas (alumnoId, asignaturaId, nota) VALUES (?, ?, ?)',
        args: [data.alumnoId, data.asignaturaId, data.nota]
      })
    }
    
    // Get the result
    const result = await client.execute({
      sql: `SELECT n.*, a.nombre as asignaturaNombre, a.codigo as asignaturaCodigo
            FROM notas n
            JOIN asignaturas a ON n.asignaturaId = a.id
            WHERE n.alumnoId = ? AND n.asignaturaId = ?`,
      args: [data.alumnoId, data.asignaturaId]
    })
    
    return NextResponse.json({
      id: result.rows[0]?.id,
      nota: data.nota,
      alumnoId: data.alumnoId,
      asignaturaId: data.asignaturaId,
      asignatura: {
        id: data.asignaturaId,
        nombre: result.rows[0]?.asignaturaNombre,
        codigo: result.rows[0]?.asignaturaCodigo
      }
    })
  } catch (error) {
    console.error('Error creating/updating nota:', error)
    return NextResponse.json({ error: 'Error al guardar nota' }, { status: 500 })
  }
}
