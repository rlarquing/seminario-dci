import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET - Obtener un alumno por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    const alumno = await db.alumno.findUnique({
      where: { id: parseInt(id) },
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
    const data = await request.json()
    const db = getDb()
    
    const alumno = await db.alumno.update({
      where: { id: parseInt(id) },
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
  } catch (error) {
    console.error('Error updating alumno:', error)
    return NextResponse.json({ error: 'Error al actualizar alumno' }, { status: 500 })
  }
}

// DELETE - Soft delete (marcar como inactivo)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    
    // Soft delete: marcar como inactivo y guardar fecha de eliminación
    const alumno = await db.alumno.update({
      where: { id: parseInt(id) },
      data: {
        activo: false,
        deletedAt: new Date()
      }
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

// PATCH - Restaurar alumno (marcar como activo)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    
    const alumno = await db.alumno.update({
      where: { id: parseInt(id) },
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
  } catch (error) {
    console.error('Error restoring alumno:', error)
    return NextResponse.json({ error: 'Error al restaurar alumno' }, { status: 500 })
  }
}
