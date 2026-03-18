/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

// GET - List all alumnos (activos por defecto, incluir eliminados con ?includeDeleted=true)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true'
    
    const client = getTursoClient()
    
    if (!client) {
      // Fallback to Prisma for local development
      const { db } = await import('@/lib/db')
      
      const where: { activo?: boolean } = {}
      if (!includeDeleted) {
        where.activo = true
      } else if (onlyDeleted) {
        where.activo = false
      }
      
      const alumnos = await db.alumno.findMany({
        where,
        orderBy: { numeroExpediente: 'asc' },
        include: {
          notas: {
            include: { asignatura: true }
          }
        }
      })
      return NextResponse.json(alumnos)
    }

    // Turso production
    let sql = 'SELECT * FROM alumnos'
    if (!includeDeleted) {
      sql += ' WHERE activo = 1'
    } else if (onlyDeleted) {
      sql += ' WHERE activo = 0'
    }
    sql += ' ORDER BY numeroExpediente ASC'
    
    const result = await client.execute(sql)

    // Get notas for each alumno
    const alumnos = []
    for (const row of result.rows) {
      const notasResult = await client.execute({
        sql: `
          SELECT n.id, n.nota, n.asignaturaId, a.nombre as asignaturaNombre, a.codigo as asignaturaCodigo
          FROM notas n
          JOIN asignaturas a ON n.asignaturaId = a.id
          WHERE n.alumnoId = ?
        `,
        args: [row.id as number]
      })

      alumnos.push({
        ...row,
        tomaHuellaBiometrica: !!row.tomaHuellaBiometrica,
        entregaFoto: !!row.entregaFoto,
        disposicionCampoMisionero: !!row.disposicionCampoMisionero,
        activo: row.activo === 1 || row.activo === true,
        notas: notasResult.rows.map(n => ({
          id: n.id,
          nota: n.nota,
          asignaturaId: n.asignaturaId,
          asignatura: {
            id: n.asignaturaId,
            nombre: n.asignaturaNombre,
            codigo: n.asignaturaCodigo
          }
        }))
      })
    }

    return NextResponse.json(alumnos)
  } catch (error) {
    console.error('Error fetching alumnos:', error)
    return NextResponse.json({ 
      error: 'Error al obtener alumnos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Create new alumno or restore deleted one
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.numeroExpediente || !data.nombre || !data.ci) {
      return NextResponse.json(
        { error: 'Los campos No. Expediente, Nombre y Carnet de Identidad son obligatorios' },
        { status: 400 }
      )
    }

    const client = getTursoClient()
    
    if (!client) {
      // Fallback to Prisma for local development
      const { db } = await import('@/lib/db')
      
      // Check if exists (including deleted)
      const existingAlumno = await db.alumno.findFirst({
        where: {
          OR: [
            { ci: data.ci },
            { numeroExpediente: parseInt(data.numeroExpediente) }
          ]
        }
      })
      
      if (existingAlumno) {
        if (!existingAlumno.activo) {
          // Restore and update deleted alumno
          const updated = await db.alumno.update({
            where: { id: existingAlumno.id },
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
              activo: true,
              deletedAt: null,
            }
          })
          return NextResponse.json({ ...updated, _restored: true }, { status: 200 })
        } else {
          // Active alumno exists
          const message = existingAlumno.ci === data.ci 
            ? 'Ya existe un alumno activo con ese carnet de identidad'
            : 'Ya existe un alumno activo con ese número de expediente'
          return NextResponse.json({ error: message }, { status: 409 })
        }
      }
      
      // Create new alumno
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
    }

    // Turso production - Check if exists (including deleted)
    const existingResult = await client.execute({
      sql: 'SELECT * FROM alumnos WHERE ci = ? OR numeroExpediente = ?',
      args: [data.ci, parseInt(data.numeroExpediente)]
    })
    
    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0]
      
      if (existing.activo === 0 || existing.activo === false) {
        // Restore and update deleted alumno
        await client.execute({
          sql: `UPDATE alumnos SET 
            numeroExpediente = ?, nombre = ?, ci = ?, telefono = ?, email = ?,
            pasaporte = ?, direccion = ?, genero = ?, nombreIglesia = ?, nombrePastor = ?,
            tomaHuellaBiometrica = ?, entregaFoto = ?, pagoCuotas = ?, 
            disposicionCampoMisionero = ?, habilidades = ?, activo = 1, deletedAt = NULL,
            updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?`,
          args: [
            parseInt(data.numeroExpediente),
            data.nombre,
            data.ci,
            data.telefono || null,
            data.email || null,
            data.pasaporte || null,
            data.direccion || null,
            data.genero || null,
            data.nombreIglesia || null,
            data.nombrePastor || null,
            data.tomaHuellaBiometrica ? 1 : 0,
            data.entregaFoto ? 1 : 0,
            data.pagoCuotas || null,
            data.disposicionCampoMisionero ? 1 : 0,
            data.habilidades || null,
            existing.id as number
          ]
        })
        
        // Get updated row
        const updatedResult = await client.execute({
          sql: 'SELECT * FROM alumnos WHERE id = ?',
          args: [existing.id as number]
        })
        
        return NextResponse.json({
          ...updatedResult.rows[0],
          tomaHuellaBiometrica: !!updatedResult.rows[0]?.tomaHuellaBiometrica,
          entregaFoto: !!updatedResult.rows[0]?.entregaFoto,
          disposicionCampoMisionero: !!updatedResult.rows[0]?.disposicionCampoMisionero,
          activo: true,
          _restored: true
        }, { status: 200 })
      } else {
        // Active alumno exists
        const message = existing.ci === data.ci 
          ? 'Ya existe un alumno activo con ese carnet de identidad'
          : 'Ya existe un alumno activo con ese número de expediente'
        return NextResponse.json({ error: message }, { status: 409 })
      }
    }

    // Create new alumno
    const result = await client.execute({
      sql: `INSERT INTO alumnos (
        numeroExpediente, nombre, ci, telefono, email, pasaporte, direccion,
        genero, nombreIglesia, nombrePastor, tomaHuellaBiometrica, entregaFoto,
        pagoCuotas, disposicionCampoMisionero, habilidades, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [
        parseInt(data.numeroExpediente),
        data.nombre,
        data.ci,
        data.telefono || null,
        data.email || null,
        data.pasaporte || null,
        data.direccion || null,
        data.genero || null,
        data.nombreIglesia || null,
        data.nombrePastor || null,
        data.tomaHuellaBiometrica ? 1 : 0,
        data.entregaFoto ? 1 : 0,
        data.pagoCuotas || null,
        data.disposicionCampoMisionero ? 1 : 0,
        data.habilidades || null,
      ]
    })

    // Get the inserted row
    const newAlumno = await client.execute({
      sql: 'SELECT * FROM alumnos WHERE id = ?',
      args: [result.lastInsertRowid as number]
    })

    return NextResponse.json({
      id: result.lastInsertRowid,
      ...newAlumno.rows[0],
      tomaHuellaBiometrica: !!newAlumno.rows[0]?.tomaHuellaBiometrica,
      entregaFoto: !!newAlumno.rows[0]?.entregaFoto,
      disposicionCampoMisionero: !!newAlumno.rows[0]?.disposicionCampoMisionero,
      activo: true,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating alumno:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({ 
      error: 'Error al crear alumno',
      details: errorMessage
    }, { status: 500 })
  }
}
