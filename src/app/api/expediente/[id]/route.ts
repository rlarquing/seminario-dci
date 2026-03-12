import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    
    const alumno = await db.alumno.findUnique({
      where: { id: parseInt(id) },
      include: {
        notas: {
          include: {
            asignatura: true
          }
        }
      }
    })

    if (!alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    // Calcular promedio
    const notasValidas = alumno.notas.filter(n => n.nota !== null)
    const promedio = notasValidas.length > 0
      ? notasValidas.reduce((acc, n) => acc + (n.nota || 0), 0) / notasValidas.length
      : null

    return NextResponse.json({
      alumno: {
        ...alumno,
        promedio
      }
    })
  } catch (error) {
    console.error('Error fetching expediente:', error)
    return NextResponse.json({ error: 'Error al obtener expediente' }, { status: 500 })
  }
}
