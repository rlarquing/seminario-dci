import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET - Obtener datos completos para certificado
export async function GET(request: Request) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const alumnoId = searchParams.get('alumnoId')
    
    if (!alumnoId) {
      return NextResponse.json({ error: 'Se requiere el ID del alumno' }, { status: 400 })
    }
    
    const alumno = await db.alumno.findUnique({
      where: { id: parseInt(alumnoId) },
      include: {
        notas: {
          include: {
            asignatura: true
          },
          orderBy: { asignaturaId: 'asc' }
        }
      }
    })
    
    if (!alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }
    
    // Calcular promedio general
    const notasValidas = alumno.notas.filter(n => n.nota !== null)
    const promedioGeneral = notasValidas.length > 0
      ? notasValidas.reduce((sum, n) => sum + (n.nota || 0), 0) / notasValidas.length
      : null
    
    return NextResponse.json({
      alumno,
      promedioGeneral: promedioGeneral ? Math.round(promedioGeneral * 100) / 100 : null
    })
  } catch (error) {
    console.error('Error fetching certificado:', error)
    return NextResponse.json({ error: 'Error al generar certificado' }, { status: 500 })
  }
}
