/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'

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

// GET - Listar alumnos activos (por defecto)
// Params opcionales: ?includeDeleted=true | ?onlyDeleted=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true'
    
    const client = getTursoClient()
    
    if (!client) {
      // Local development with Prisma
      const db = getDb()
      
      const where: { activo?: boolean } = {}
      if (!includeDeleted) {
        where.activo = true  // Solo activos por defecto
      } else if (onlyDeleted) {
        where.activo = false  // Solo eliminados
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
    
    const alumnos = []
    for (const row of result.rows) {
      const notasResult = await client.execute({
        sql: `SELECT n.*, a.nombre as asignaturaNombre, a.codigo as asignaturaCodigo
              FROM notas n
              JOIN asignaturas a ON n.asignaturaId = a.id
              WHERE n.alumnoId = ?`,
        args: [row.id]
      })
      
      alumnos.push({
        ...row,
        tomaHuellaBiometrica: !!row.tomaHuellaBiometrica,
        entregaFoto: !!row.entregaFoto,
        disposicionCampoMisionero: !!row.disposicionCampoMisionero,
        notas: notasResult.rows.map(n => ({
          id: n.id,
          nota: n.nota,
          alumnoId: n.alumnoId,
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

// POST - Crear nuevo alumno
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
      // Local development with Prisma
      const db = getDb()
      
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
    
    // Turso production - Check if exists
    const existing = await client.execute({
      sql: 'SELECT * FROM alumnos WHERE ci = ? OR numeroExpediente = ?',
      args: [data.ci, parseInt(data.numeroExpediente)]
    })
    
    if (existing.rows.length > 0) {
      const message = existing.rows[0].ci === data.ci
        ? 'Ya existe un alumno con ese carnet de identidad'
        : 'Ya existe un alumno con ese número de expediente'
      return NextResponse.json({ error: message }, { status: 409 })
    }
    
    // Create new aluno
    const result = await client.execute({
      sql: `INSERT INTO alumnos (
        numeroExpediente, nombre, ci, telefono, email, pasaporte, direccion,
        genero, nombreIglesia, nombrePastor, tomaHuellaBiometrica, entregaFoto,
        pagoCuotas, disposicionCampoMisionero, habilidades
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    
    // Get the created row
    const newAlumno = await client.execute({
      sql: 'SELECT * FROM alumnos WHERE id = ?',
      args: [result.lastInsertRowid]
    })
    
    return NextResponse.json(newAlumno.rows[0], { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating alumno:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Error al crear alumno',
      details: errorMessage
    }, { status: 500 })
  }
}