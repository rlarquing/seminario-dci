import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todas las notas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alumnoId = searchParams.get('alumnoId')
    
    if (alumnoId) {
      const notas = await db.nota.findMany({
        where: { alumnoId: parseInt(alumnoId) },
        include: {
          asignatura: true
        },
        orderBy: { asignaturaId: 'asc' }
      })
      return NextResponse.json(notas)
    }
    
    const notas = await db.nota.findMany({
      include: {
        alumno: true,
        asignatura: true
      },
      orderBy: [{ alumnoId: 'asc' }, { asignaturaId: 'asc' }]
    })
    return NextResponse.json(notas)
  } catch (error) {
    console.error('Error fetching notas:', error)
    return NextResponse.json({ error: 'Error al obtener notas' }, { status: 500 })
  }
}

// POST - Crear o actualizar nota
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Usar upsert para crear o actualizar
    const nota = await db.nota.upsert({
      where: {
        alumnoId_asignaturaId: {
          alumnoId: data.alumnoId,
          asignaturaId: data.asignaturaId
        }
      },
      update: {
        nota: data.nota,
        observaciones: data.observaciones || null
      },
      create: {
        alumnoId: data.alumnoId,
        asignaturaId: data.asignaturaId,
        nota: data.nota,
        observaciones: data.observaciones || null
      },
      include: {
        asignatura: true
      }
    })
    
    return NextResponse.json(nota)
  } catch (error) {
    console.error('Error creating/updating nota:', error)
    return NextResponse.json({ error: 'Error al guardar nota' }, { status: 500 })
  }
}
