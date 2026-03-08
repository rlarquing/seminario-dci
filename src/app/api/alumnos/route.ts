import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los alumnos
export async function GET() {
  try {
    const alumnos = await db.alumno.findMany({
      orderBy: { id: 'asc' },
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
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const alumno = await db.alumno.create({
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
    console.error('Error creating alumno:', error)
    return NextResponse.json({ error: 'Error al crear alumno' }, { status: 500 })
  }
}
