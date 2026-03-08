import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener un alumno por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const alumno = await db.alumno.update({
      where: { id: parseInt(id) },
      data: {
        numeroExpediente: parseInt(data.numeroExpediente),
        nombre: data.nombre,
        apellidos: data.apellidos,
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

// DELETE - Eliminar alumno
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.alumno.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting alumno:', error)
    return NextResponse.json({ error: 'Error al eliminar alumno' }, { status: 500 })
  }
}
