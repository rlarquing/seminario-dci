import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todas las asignaturas
export async function GET() {
  try {
    const asignaturas = await db.asignatura.findMany({
      orderBy: { id: 'asc' }
    })
    return NextResponse.json(asignaturas)
  } catch (error) {
    console.error('Error fetching asignaturas:', error)
    return NextResponse.json({ error: 'Error al obtener asignaturas' }, { status: 500 })
  }
}

// POST - Crear nueva asignatura
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const asignatura = await db.asignatura.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo || null,
      }
    })
    
    return NextResponse.json(asignatura)
  } catch (error) {
    console.error('Error creating asignatura:', error)
    return NextResponse.json({ error: 'Error al crear asignatura' }, { status: 500 })
  }
}
