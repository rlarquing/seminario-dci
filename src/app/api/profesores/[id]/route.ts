import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET - Obtener un profesor por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb()
    const { id } = await params
    const profesor = await db.profesor.findUnique({
      where: { id: parseInt(id) },
      include: {
        asignatura: true
      }
    })
    
    if (!profesor) {
      return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })
    }
    
    return NextResponse.json(profesor)
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
    const db = getDb()
    const { id } = await params
    const data = await request.json()
    
    const profesor = await db.profesor.update({
      where: { id: parseInt(id) },
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
  } catch (error) {
    console.error('Error updating profesor:', error)
    return NextResponse.json({ error: 'Error al actualizar profesor' }, { status: 500 })
  }
}

// DELETE - Soft delete (marcar como inactivo)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb()
    const { id } = await params
    
    // Soft delete: marcar como inactivo y guardar fecha de eliminación
    const profesor = await db.profesor.update({
      where: { id: parseInt(id) },
      data: {
        activo: false,
        deletedAt: new Date()
      }
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

// PATCH - Restaurar profesor (marcar como activo)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb()
    const { id } = await params
    
    const profesor = await db.profesor.update({
      where: { id: parseInt(id) },
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
  } catch (error) {
    console.error('Error restoring profesor:', error)
    return NextResponse.json({ error: 'Error al restaurar profesor' }, { status: 500 })
  }
}
