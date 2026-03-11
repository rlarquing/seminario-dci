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
    
    return NextResponse.json(alumno)
  } catch (error) {
    console.error('Error creating alumno:', error)
    return NextResponse.json({ error: 'Error al crear alumno' }, { status: 500 })
  }
}
