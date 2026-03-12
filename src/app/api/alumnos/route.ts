import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET - Listar todos los alumnos
export async function GET() {
  try {
    const db = getDb()
    const alumnos = await db.alumno.findMany({
      orderBy: { numeroExpediente: 'asc' },
      include: {
        notas: {
          include: {
            asignatura: true
          }
        }
      }
    })
    return NextResponse.json(alumnos)
  } catch (error) {
    console.error('Error fetching alumnos:', error)
    return NextResponse.json({ error: 'Error al obtener alumnos' }, { status: 500 })
  }
}

// POST - Crear nuevo alumno
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const db = getDb()
    
    // Validar campos requeridos
    if (!data.numeroExpediente || !data.nombre || !data.ci) {
      return NextResponse.json(
        { error: 'Los campos No. Expediente, Nombre y Carnet de Identidad son obligatorios' },
        { status: 400 }
      )
    }
    
    const alumno = await db.alumno.create({
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
    
    return NextResponse.json(alumno, { status: 201 })
  } catch (error: any) {
    console.error('Error creating alumno:', error)
    
    // Manejar errores de unicidad
    if (error.code === 'P2002') {
      const message = error.meta?.target?.includes('numeroExpediente')
        ? 'Ya existe un alumno con ese número de expediente'
        : error.meta?.target?.includes('ci')
        ? 'Ya existe un alumno con ese carnet de identidad'
        : 'Ya existe un alumno con esos datos'
      
      return NextResponse.json({ error: message }, { status: 409 })
    }
    
    return NextResponse.json({ error: 'Error al crear alumno' }, { status: 500 })
  }
}
