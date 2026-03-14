import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET - Obtener una asignatura por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb()
    const { id } = await params
    const asignatura = await db.asignatura.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!asignatura) {
      return NextResponse.json({ error: 'Asignatura no encontrada' }, { status: 404 })
    }
    
    return NextResponse.json(asignatura)
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
    const db = getDb()
    const { id } = await params
    const data = await request.json()
    
    const asignatura = await db.asignatura.update({
      where: { id: parseInt(id) },
      data: {
        nombre: data.nombre,
        codigo: data.codigo || null,
      }
    })
    
    return NextResponse.json(asignatura)
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
    const db = getDb()
    const { id } = await params
    const idNum = parseInt(id)
    
    // Soft delete: marcar como inactiva y guardar fecha de eliminación
    const asignatura = await db.asignatura.update({
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
    const db = getDb()
    const { id } = await params
    
    const asignatura = await db.asignatura.update({
      where: { id: parseInt(id) },
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
  } catch (error) {
    console.error('Error restoring asignatura:', error)
    return NextResponse.json({ error: 'Error al restaurar asignatura' }, { status: 500 })
  }
}
