import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { NextRequest } from 'next/server'

// GET - Listar todos los profesores (activos por defecto)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true'
    
    const db = getDb()
    
    const where: { activo?: boolean } = {}
    if (!includeDeleted) {
      where.activo = true
    } else if (onlyDeleted) {
      where.activo = false
    }
    
    const profesores = await db.profesor.findMany({
      where,
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
