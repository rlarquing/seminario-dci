import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener un profesor por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const profesor = await db.profesor.update({
      where: { id: parseInt(id) },
      data: {
        nombre: data.nombre,
        apellidos: data.apellidos,
        ci: data.ci,
        asignaturaId: data.asignaturaId || null,
        telefono: data.telefono || null,
        email: data.email || null,
      }
    })
    
    return NextResponse.json(profesor)
  } catch (error) {
    console.error('Error updating profesor:', error)
    return NextResponse.json({ error: 'Error al actualizar profesor' }, { status: 500 })
  }
}

// DELETE - Eliminar profesor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.profesor.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting profesor:', error)
    return NextResponse.json({ error: 'Error al eliminar profesor' }, { status: 500 })
  }
}
