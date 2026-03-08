import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los profesores
export async function GET() {
  try {
    const profesores = await db.profesor.findMany({
      orderBy: { id: 'asc' },
      include: {
        asignatura: true
      }
    })
    return NextResponse.json(profesores)
  } catch (error) {
    console.error('Error fetching profesores:', error)
    return NextResponse.json({ error: 'Error al obtener profesores' }, { status: 500 })
  }
}

// POST - Crear nuevo profesor
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const profesor = await db.profesor.create({
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
    console.error('Error creating profesor:', error)
    return NextResponse.json({ error: 'Error al crear profesor' }, { status: 500 })
  }
}
