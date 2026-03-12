import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET - Listar todos los profesores
export async function GET() {
  try {
    const db = getDb()
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
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const db = getDb()
    
    const profesor = await db.profesor.create({
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
    console.error('Error creating profesor:', error)
    return NextResponse.json({ error: 'Error al crear profesor' }, { status: 500 })
  }
}
