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

// GET - Obtener un profesor por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id)
    const client = getTursoClient()
    
    if (!client) {
      const { db } = await import('@/lib/db')
      const profesor = await db.profesor.findUnique({
        where: { id: idNum },
        include: { asignatura: true }
      })
      
      if (!profesor) {
        return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })
      }
      
      return NextResponse.json(profesor)
    }
    
    // Turso
    const result = await client.execute({
      sql: `SELECT p.*, a.nombre as asignaturaNombre, a.codigo as asignaturaCodigo
            FROM profesores p
            LEFT JOIN asignaturas a ON p.asignaturaId = a.id
            WHERE p.id = ?`,
      args: [idNum]
    })
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })
    }
    
    const row = result.rows[0]
    return NextResponse.json({
      ...row,
      tomaHuellaBiometrica: !!row.tomaHuellaBiometrica,
      entregaFoto: !!row.entregaFoto,
      activo: row.activo === 1 || row.activo === true,
      asignatura: row.asignaturaId ? {
        id: row.asignaturaId,
        nombre: row.asignaturaNombre,
        codigo: row.asignaturaCodigo
      } : null
    })
  } catch (error) {
    console.error('Error fetching profesor:', error)
    return NextResponse.json({ error: 'Error al obtener profesor' }, { status: 500 })
  }
}

// PUT - Actualizar profesor
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id)
    const data = await request.json()
    const client = getTursoClient()
    
    if (!client) {
      const { db } = await import('@/lib/db')
      const profesor = await db.profesor.update({
        where: { id: idNum },
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
          asignaturaId: data.asignaturaId ? parseInt(data.asignaturaId) : null,
        }
      })
      return NextResponse.json(profesor)
    }
    
    // Turso
    await client.execute({
      sql: `UPDATE profesores SET 
        nombre = ?, ci = ?, telefono = ?, email = ?, genero = ?,
        nombreIglesia = ?, nombrePastor = ?, tomaHuellaBiometrica = ?, 
        entregaFoto = ?, asignaturaId = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
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
        data.asignaturaId ? parseInt(data.asignaturaId) : null,
        idNum
      ]
    })
    
    const result = await client.execute({
      sql: 'SELECT * FROM profesores WHERE id = ?',
      args: [idNum]
    })
    
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating profesor:', error)
    return NextResponse.json({ error: 'Error al actualizar profesor' }, { status: 500 })
  }
}

// DELETE - Soft delete
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id)
    const client = getTursoClient()
    
    if (!client) {
      const { db } = await import('@/lib/db')
      await db.profesor.update({
        where: { id: idNum },
        data: {
          activo: false,
          deletedAt: new Date()
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Profesor eliminado correctamente. Puede restaurarlo desde la sección de eliminados.' 
      })
    }
    
    // Turso - Soft delete
    await client.execute({
      sql: 'UPDATE profesores SET activo = 0, deletedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [idNum]
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profesor eliminado correctamente. Puede restaurarlo desde la sección de eliminados.' 
    })
  } catch (error) {
    console.error('Error deleting profesor:', error)
    return NextResponse.json({ error: 'Error al eliminar profesor' }, { status: 500 })
  }
}

// PATCH - Restaurar profesor
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id)
    const client = getTursoClient()
    
    if (!client) {
      const { db } = await import('@/lib/db')
      const profesor = await db.profesor.update({
        where: { id: idNum },
        data: {
          activo: true,
          deletedAt: null
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Profesor restaurado correctamente',
        profesor 
      })
    }
    
    // Turso
    await client.execute({
      sql: 'UPDATE profesores SET activo = 1, deletedAt = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [idNum]
    })
    
    const result = await client.execute({
      sql: 'SELECT * FROM profesores WHERE id = ?',
      args: [idNum]
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profesor restaurado correctamente',
      profesor: result.rows[0]
    })
  } catch (error) {
    console.error('Error restoring profesor:', error)
    return NextResponse.json({ error: 'Error al restaurar profesor' }, { status: 500 })
  }
}
