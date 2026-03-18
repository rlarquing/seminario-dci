/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from 'next/server'

// Direct Turso client for production
function getTursoClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (!tursoUrl || !tursoToken) {
    return null
  }

  const { createClient } = require('@libsql/client')
  return createClient({
    url: tursoUrl,
    authToken: tursoToken,
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id)
    const client = getTursoClient()
    
    if (!client) {
      // Local development with Prisma
      const { db } = await import('@/lib/db')
      
      const alumno = await db.alumno.findUnique({
        where: { id: idNum },
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
    }
    
    // Turso production
    const alumnoResult = await client.execute({
      sql: 'SELECT * FROM alumnos WHERE id = ?',
      args: [idNum]
    })
    
    if (alumnoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }
    
    // Get notas with asignaturas
    const notasResult = await client.execute({
      sql: `SELECT n.id, n.nota, n.asignaturaId, a.nombre as asignaturaNombre, a.codigo as asignaturaCodigo
            FROM notas n
            JOIN asignaturas a ON n.asignaturaId = a.id
            WHERE n.alumnoId = ?
            ORDER BY n.asignaturaId ASC`,
      args: [idNum]
    })
    
    const notas = notasResult.rows.map(n => ({
      id: n.id,
      nota: n.nota,
      asignaturaId: n.asignaturaId,
      asignatura: {
        id: n.asignaturaId,
        nombre: n.asignaturaNombre,
        codigo: n.asignaturaCodigo
      }
    }))
    
    // Build alumno object
    const row = alumnoResult.rows[0]
    const alumno = {
      ...row,
      activo: row.activo === 1 || row.activo === true,
      tomaHuellaBiometrica: !!row.tomaHuellaBiometrica,
      entregaFoto: !!row.entregaFoto,
      disposicionCampoMisionero: !!row.disposicionCampoMisionero,
      notas
    }
    
    // Calcular promedio
    const notasValidas = notas.filter(n => n.nota !== null)
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
