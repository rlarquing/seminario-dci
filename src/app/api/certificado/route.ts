/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server'

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

// GET - Obtener datos completos para certificado
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const alumnoId = searchParams.get('alumnoId')
    
    if (!alumnoId) {
      return NextResponse.json({ error: 'Se requiere el ID del alumno' }, { status: 400 })
    }
    
    const idNum = parseInt(alumnoId)
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
    }
    
    // Turso production
    const alumnoResult = await client.execute({
      sql: 'SELECT * FROM alumnos WHERE id = ?',
      args: [idNum]
    })
    
    if (alumnoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }
    
    const alumnoRow = alumnoResult.rows[0]
    
    // Get notas with asignaturas
    const notasResult = await client.execute({
      sql: `SELECT n.*, a.nombre as asignaturaNombre, a.codigo as asignaturaCodigo
            FROM notas n
            JOIN asignaturas a ON n.asignaturaId = a.id
            WHERE n.alumnoId = ?
            ORDER BY n.asignaturaId ASC`,
      args: [idNum]
    })
    
    const notas = notasResult.rows.map(n => ({
      id: n.id,
      alumnoId: n.alumnoId,
      asignaturaId: n.asignaturaId,
      nota: n.nota,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      asignatura: {
        id: n.asignaturaId,
        nombre: n.asignaturaNombre,
        codigo: n.asignaturaCodigo
      }
    }))
    
    // Build alumno object
    const alumno = {
      ...alumnoRow,
      activo: alumnoRow.activo === 1 || alumnoRow.activo === true,
      tomaHuellaBiometrica: !!alumnoRow.tomaHuellaBiometrica,
      entregaFoto: !!alumnoRow.entregaFoto,
      disposicionCampoMisionero: !!alumnoRow.disposicionCampoMisionero,
      notas
    }
    
    // Calcular promedio general
    const notasValidas = notas.filter(n => n.nota !== null)
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
