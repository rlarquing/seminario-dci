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

// GET - Obtener un alumno por ID
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
      const alumno = await db.alumno.findUnique({
        where: { id: idNum },
        include: {
          notas: {
            include: {
              asignatura: true
            }
          }
        }
      })
      
      if (!alumno) {
        return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
      }
      
      return NextResponse.json(alumno)
    }
    
    // Turso
    const result = await client.execute({
      sql: 'SELECT * FROM alumnos WHERE id = ?',
      args: [idNum]
    })
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }
    
    // Get notas
    const notasResult = await client.execute({
      sql: `SELECT n.id, n.nota, n.asignaturaId, a.nombre as asignaturaNombre, a.codigo as asignaturaCodigo
            FROM notas n
            JOIN asignaturas a ON n.asignaturaId = a.id
            WHERE n.alumnoId = ?`,
      args: [idNum]
    })
    
    const row = result.rows[0]
    return NextResponse.json({
      ...row,
      tomaHuellaBiometrica: !!row.tomaHuellaBiometrica,
      entregaFoto: !!row.entregaFoto,
      disposicionCampoMisionero: !!row.disposicionCampoMisionero,
      activo: row.activo === 1 || row.activo === true,
      notas: notasResult.rows.map(n => ({
        id: n.id,
        nota: n.nota,
        asignaturaId: n.asignaturaId,
        asignatura: {
          id: n.asignaturaId,
          nombre: n.asignaturaNombre,
          codigo: n.asignaturaCodigo
        }
      }))
    })
  } catch (error) {
    console.error('Error fetching alumno:', error)
    return NextResponse.json({ error: 'Error al obtener alumno' }, { status: 500 })
  }
}

// PUT - Actualizar alumno
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
      const alumno = await db.alumno.update({
        where: { id: idNum },
        data: {
          numeroExpediente: parseInt(data.numeroExpediente),
          nombre: data.nombre,
          ci: data.ci,
          telefono: data.telefono || null,
          email: data.email || null,
          pasaporte: data.pasaporte || null,
          direccion: data.direccion || null,
          genero: data.genero || null,
          nombreIglesia: data.nombreIglesia || null,
          nombrePastor: data.nombrePastor || null,
          tomaHuellaBiometrica: data.tomaHuellaBiometrica || false,
          entregaFoto: data.entregaFoto || false,
          pagoCuotas: data.pagoCuotas || null,
          disposicionCampoMisionero: data.disposicionCampoMisionero || false,
          habilidades: data.habilidades || null,
        }
      })
      return NextResponse.json(alumno)
    }
    
    // Turso
    await client.execute({
      sql: `UPDATE alumnos SET 
        numeroExpediente = ?, nombre = ?, ci = ?, telefono = ?, email = ?,
        pasaporte = ?, direccion = ?, genero = ?, nombreIglesia = ?, nombrePastor = ?,
        tomaHuellaBiometrica = ?, entregaFoto = ?, pagoCuotas = ?, 
        disposicionCampoMisionero = ?, habilidades = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
      args: [
        parseInt(data.numeroExpediente),
        data.nombre,
        data.ci,
        data.telefono || null,
        data.email || null,
        data.pasaporte || null,
        data.direccion || null,
        data.genero || null,
        data.nombreIglesia || null,
        data.nombrePastor || null,
        data.tomaHuellaBiometrica ? 1 : 0,
        data.entregaFoto ? 1 : 0,
        data.pagoCuotas || null,
        data.disposicionCampoMisionero ? 1 : 0,
        data.habilidades || null,
        idNum
      ]
    })
    
    const result = await client.execute({
      sql: 'SELECT * FROM alumnos WHERE id = ?',
      args: [idNum]
    })
    
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating alumno:', error)
    return NextResponse.json({ error: 'Error al actualizar alumno' }, { status: 500 })
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
      await db.alumno.update({
        where: { id: idNum },
        data: {
          activo: false,
          deletedAt: new Date()
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Alumno eliminado correctamente. Puede restaurarlo desde la sección de eliminados.' 
      })
    }
    
    // Turso - Soft delete
    await client.execute({
      sql: 'UPDATE alumnos SET activo = 0, deletedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [idNum]
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Alumno eliminado correctamente. Puede restaurarlo desde la sección de eliminados.' 
    })
  } catch (error) {
    console.error('Error deleting alumno:', error)
    return NextResponse.json({ error: 'Error al eliminar alumno' }, { status: 500 })
  }
}

// PATCH - Restaurar alumno
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
      const alumno = await db.alumno.update({
        where: { id: idNum },
        data: {
          activo: true,
          deletedAt: null
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Alumno restaurado correctamente',
        alumno 
      })
    }
    
    // Turso
    await client.execute({
      sql: 'UPDATE alumnos SET activo = 1, deletedAt = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [idNum]
    })
    
    const result = await client.execute({
      sql: 'SELECT * FROM alumnos WHERE id = ?',
      args: [idNum]
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Alumno restaurado correctamente',
      alumno: result.rows[0]
    })
  } catch (error) {
    console.error('Error restoring alumno:', error)
    return NextResponse.json({ error: 'Error al restaurar alumno' }, { status: 500 })
  }
}
