/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server'

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

// GET - Obtener una asignatura por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = getTursoClient()
    
    if (!client) {
      // Local development con Prisma
      const { db } = await import('@/lib/db')
      const asignatura = await db.asignatura.findUnique({
        where: { id: parseInt(id) }
      })
      
      if (!asignatura) {
        return NextResponse.json({ error: 'Asignatura no encontrada' }, { status: 404 })
      }
      
      return NextResponse.json(asignatura)
    }
    
    // Turso production
    const result = await client.execute({
      sql: 'SELECT * FROM asignaturas WHERE id = ?',
      args: [parseInt(id)]
    })
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Asignatura no encontrada' }, { status: 404 })
    }
    
    const row = result.rows[0]
    return NextResponse.json({
      ...row,
      activo: row.activo === 1 || row.activo === true
    })
  } catch (error) {
    console.error('Error fetching asignatura:', error)
    return NextResponse.json({ error: 'Error al obtener asignatura' }, { status: 500 })
  }
}

// PUT - Actualizar asignatura
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const client = getTursoClient()
    
    if (!client) {
      // Local development
      const { db } = await import('@/lib/db')
      const asignatura = await db.asignatura.update({
        where: { id: parseInt(id) },
        data: {
          nombre: data.nombre,
          codigo: data.codigo || null,
        }
      })
      return NextResponse.json(asignatura)
    }
    
    // Turso production
    await client.execute({
      sql: 'UPDATE asignaturas SET nombre = ?, codigo = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [data.nombre, data.codigo || null, parseInt(id)]
    })
    
    const result = await client.execute({
      sql: 'SELECT * FROM asignaturas WHERE id = ?',
      args: [parseInt(id)]
    })
    
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating asignatura:', error)
    return NextResponse.json({ error: 'Error al actualizar asignatura' }, { status: 500 })
  }
}

// DELETE - Soft delete (marcar como inactiva)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id)
    const client = getTursoClient()
    
    if (!client) {
      // Local development
      const { db } = await import('@/lib/db')
      await db.asignatura.update({
        where: { id: idNum },
        data: {
          activo: false,
          deletedAt: new Date()
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Asignatura eliminada correctamente. Puede restaurarla desde la sección de eliminados.' 
      })
    }
    
    // Turso production - Soft delete
    await client.execute({
      sql: 'UPDATE asignaturas SET activo = 0, deletedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [idNum]
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Asignatura eliminada correctamente. Puede restaurarla desde la sección de eliminados.' 
    })
  } catch (error) {
    console.error('Error deleting asignatura:', error)
    return NextResponse.json({ error: 'Error al eliminar asignatura' }, { status: 500 })
  }
}

// PATCH - Restaurar asignatura (marcar como activa)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id)
    const client = getTursoClient()
    
    if (!client) {
      // Local development
      const { db } = await import('@/lib/db')
      const asignatura = await db.asignatura.update({
        where: { id: idNum },
        data: {
          activo: true,
          deletedAt: null
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Asignatura restaurada correctamente',
        asignatura 
      })
    }
    
    // Turso production
    await client.execute({
      sql: 'UPDATE asignaturas SET activo = 1, deletedAt = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [idNum]
    })
    
    const result = await client.execute({
      sql: 'SELECT * FROM asignaturas WHERE id = ?',
      args: [idNum]
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Asignatura restaurada correctamente',
      asignatura: result.rows[0]
    })
  } catch (error) {
    console.error('Error restoring asignatura:', error)
    return NextResponse.json({ error: 'Error al restaurar asignatura' }, { status: 500 })
  }
}
