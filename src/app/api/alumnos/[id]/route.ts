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
        nombre: data.nombre,
        apellidos: data.apellidos,
        ci: data.ci,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        genero: data.genero || null,
        direccion: data.direccion || null,
        pasaporte: data.pasaporte || null,
        telefono: data.telefono || null,
        movil: data.movil || null,
        email: data.email || null,
        estadoCivil: data.estadoCivil || null,
        nombreIglesia: data.nombreIglesia || null,
        nombrePastores: data.nombrePastores || null,
        cartaRecomendacion: data.cartaRecomendacion || false,
        pagoMatricula: data.pagoMatricula || null,
        disposicionCampoMisionero: data.disposicionCampoMisionero || false,
        redesSociales: data.redesSociales || null,
        tomaInformacionBiometrica: data.tomaInformacionBiometrica || false,
        numeroExpediente: data.numeroExpediente || null,
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
