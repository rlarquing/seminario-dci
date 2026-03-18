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

// GET - Exportar todos los datos (backup)
export async function GET() {
  try {
    const client = getTursoClient()
    
    if (!client) {
      // Local development with Prisma
      const { db } = await import('@/lib/db')
      
      const [alumnos, profesores, asignaturas, notas] = await Promise.all([
        db.alumno.findMany({ orderBy: { id: 'asc' } }),
        db.profesor.findMany({ orderBy: { id: 'asc' } }),
        db.asignatura.findMany({ orderBy: { id: 'asc' } }),
        db.nota.findMany({ orderBy: [{ alumnoId: 'asc' }, { asignaturaId: 'asc' }] }),
      ])
      
      const backup = {
        version: '1.0',
        fecha: new Date().toISOString(),
        app: 'Seminario DCI',
        datos: {
          alumnos,
          profesores,
          asignaturas,
          notas,
        },
        estadisticas: {
          totalAlumnos: alumnos.length,
          totalProfesores: profesores.length,
          totalAsignaturas: asignaturas.length,
          totalNotas: notas.length,
        }
      }
      
      return NextResponse.json(backup)
    }
    
    // Turso production
    const [alumnosRes, profesoresRes, asignaturasRes, notasRes] = await Promise.all([
      client.execute('SELECT * FROM alumnos ORDER BY id ASC'),
      client.execute('SELECT * FROM profesores ORDER BY id ASC'),
      client.execute('SELECT * FROM asignaturas ORDER BY id ASC'),
      client.execute('SELECT * FROM notas ORDER BY alumnoId ASC, asignaturaId ASC'),
    ])
    
    const backup = {
      version: '1.0',
      fecha: new Date().toISOString(),
      app: 'Seminario DCI',
      datos: {
        alumnos: alumnosRes.rows.map(row => ({
          ...row,
          activo: row.activo === 1 || row.activo === true,
          tomaHuellaBiometrica: !!row.tomaHuellaBiometrica,
          entregaFoto: !!row.entregaFoto,
          disposicionCampoMisionero: !!row.disposicionCampoMisionero,
        })),
        profesores: profesoresRes.rows.map(row => ({
          ...row,
          activo: row.activo === 1 || row.activo === true,
          tomaHuellaBiometrica: !!row.tomaHuellaBiometrica,
          entregaFoto: !!row.entregaFoto,
        })),
        asignaturas: asignaturasRes.rows.map(row => ({
          ...row,
          activo: row.activo === 1 || row.activo === true,
        })),
        notas: notasRes.rows,
      },
      estadisticas: {
        totalAlumnos: alumnosRes.rows.length,
        totalProfesores: profesoresRes.rows.length,
        totalAsignaturas: asignaturasRes.rows.length,
        totalNotas: notasRes.rows.length,
      }
    }
    
    return NextResponse.json(backup)
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json({ error: 'Error al crear backup' }, { status: 500 })
  }
}

// POST - Importar datos (restore)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validar estructura del backup
    if (!data.version || !data.datos) {
      return NextResponse.json({ error: 'Formato de backup inválido' }, { status: 400 })
    }
    
    const { alumnos, profesores, asignaturas, notas } = data.datos
    
    if (!alumnos || !profesores || !asignaturas || !notas) {
      return NextResponse.json({ error: 'El backup no contiene todos los datos necesarios' }, { status: 400 })
    }
    
    const client = getTursoClient()
    
    if (!client) {
      // Local development with Prisma
      const { db } = await import('@/lib/db')
      
      // Usar transacción para asegurar integridad
      const result = await db.$transaction(async (tx) => {
        let insertedAlumnos = 0
        let insertedProfesores = 0
        let insertedAsignaturas = 0
        let insertedNotas = 0
        
        // Limpiar tablas existentes (en orden por foreign keys)
        await tx.nota.deleteMany()
        await tx.profesor.deleteMany()
        await tx.alumno.deleteMany()
        await tx.asignatura.deleteMany()
        
        // Insertar asignaturas primero
        for (const asig of asignaturas) {
          await tx.asignatura.create({
            data: {
              id: asig.id,
              nombre: asig.nombre,
              codigo: asig.codigo,
              activo: asig.activo ?? true,
              deletedAt: asig.deletedAt ? new Date(asig.deletedAt) : null,
              createdAt: asig.createdAt ? new Date(asig.createdAt) : new Date(),
              updatedAt: asig.updatedAt ? new Date(asig.updatedAt) : new Date(),
            }
          })
          insertedAsignaturas++
        }
        
        // Insertar alumnos
        for (const alum of alumnos) {
          await tx.alumno.create({
            data: {
              id: alum.id,
              numeroExpediente: alum.numeroExpediente,
              nombre: alum.nombre,
              ci: alum.ci,
              telefono: alum.telefono,
              email: alum.email,
              pasaporte: alum.pasaporte,
              direccion: alum.direccion,
              genero: alum.genero,
              nombreIglesia: alum.nombreIglesia,
              nombrePastor: alum.nombrePastor,
              tomaHuellaBiometrica: alum.tomaHuellaBiometrica ?? false,
              entregaFoto: alum.entregaFoto ?? false,
              pagoCuotas: alum.pagoCuotas,
              disposicionCampoMisionero: alum.disposicionCampoMisionero ?? false,
              habilidades: alum.habilidades,
              activo: alum.activo ?? true,
              deletedAt: alum.deletedAt ? new Date(alum.deletedAt) : null,
              createdAt: alum.createdAt ? new Date(alum.createdAt) : new Date(),
              updatedAt: alum.updatedAt ? new Date(alum.updatedAt) : new Date(),
            }
          })
          insertedAlumnos++
        }
        
        // Insertar profesores
        for (const prof of profesores) {
          await tx.profesor.create({
            data: {
              id: prof.id,
              nombre: prof.nombre,
              ci: prof.ci,
              telefono: prof.telefono,
              email: prof.email,
              genero: prof.genero,
              nombreIglesia: prof.nombreIglesia,
              nombrePastor: prof.nombrePastor,
              tomaHuellaBiometrica: prof.tomaHuellaBiometrica ?? false,
              entregaFoto: prof.entregaFoto ?? false,
              asignaturaId: prof.asignaturaId,
              activo: prof.activo ?? true,
              deletedAt: prof.deletedAt ? new Date(prof.deletedAt) : null,
              createdAt: prof.createdAt ? new Date(prof.createdAt) : new Date(),
              updatedAt: prof.updatedAt ? new Date(prof.updatedAt) : new Date(),
            }
          })
          insertedProfesores++
        }
        
        // Insertar notas
        for (const nota of notas) {
          await tx.nota.create({
            data: {
              id: nota.id,
              alumnoId: nota.alumnoId,
              asignaturaId: nota.asignaturaId,
              nota: nota.nota,
              createdAt: nota.createdAt ? new Date(nota.createdAt) : new Date(),
              updatedAt: nota.updatedAt ? new Date(nota.updatedAt) : new Date(),
            }
          })
          insertedNotas++
        }
        
        return {
          alumnos: insertedAlumnos,
          profesores: insertedProfesores,
          asignaturas: insertedAsignaturas,
          notas: insertedNotas,
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Backup restaurado correctamente',
        resultado: result
      })
    }
    
    // Turso production - batch operations
    // Limpiar tablas existentes
    await client.execute('DELETE FROM notas')
    await client.execute('DELETE FROM profesores')
    await client.execute('DELETE FROM alumnos')
    await client.execute('DELETE FROM asignaturas')
    
    let insertedAsignaturas = 0
    let insertedAlumnos = 0
    let insertedProfesores = 0
    let insertedNotas = 0
    
    // Insertar asignaturas
    for (const asig of asignaturas) {
      await client.execute({
        sql: `INSERT INTO asignaturas (id, nombre, codigo, activo, deletedAt, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          asig.id,
          asig.nombre,
          asig.codigo || null,
          asig.activo !== false ? 1 : 0,
          asig.deletedAt || null,
          asig.createdAt || new Date().toISOString(),
          asig.updatedAt || new Date().toISOString(),
        ]
      })
      insertedAsignaturas++
    }
    
    // Insertar alumnos
    for (const alum of alumnos) {
      await client.execute({
        sql: `INSERT INTO alumnos (id, numeroExpediente, nombre, ci, telefono, email, pasaporte, 
               direccion, genero, nombreIglesia, nombrePastor, tomaHuellaBiometrica, entregaFoto,
               pagoCuotas, disposicionCampoMisionero, habilidades, activo, deletedAt, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          alum.id,
          alum.numeroExpediente,
          alum.nombre,
          alum.ci,
          alum.telefono || null,
          alum.email || null,
          alum.pasaporte || null,
          alum.direccion || null,
          alum.genero || null,
          alum.nombreIglesia || null,
          alum.nombrePastor || null,
          alum.tomaHuellaBiometrica ? 1 : 0,
          alum.entregaFoto ? 1 : 0,
          alum.pagoCuotas || null,
          alum.disposicionCampoMisionero ? 1 : 0,
          alum.habilidades || null,
          alum.activo !== false ? 1 : 0,
          alum.deletedAt || null,
          alum.createdAt || new Date().toISOString(),
          alum.updatedAt || new Date().toISOString(),
        ]
      })
      insertedAlumnos++
    }
    
    // Insertar profesores
    for (const prof of profesores) {
      await client.execute({
        sql: `INSERT INTO profesores (id, nombre, ci, telefono, email, genero, nombreIglesia,
               nombrePastor, tomaHuellaBiometrica, entregaFoto, asignaturaId, activo, deletedAt, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          prof.id,
          prof.nombre,
          prof.ci,
          prof.telefono || null,
          prof.email || null,
          prof.genero || null,
          prof.nombreIglesia || null,
          prof.nombrePastor || null,
          prof.tomaHuellaBiometrica ? 1 : 0,
          prof.entregaFoto ? 1 : 0,
          prof.asignaturaId || null,
          prof.activo !== false ? 1 : 0,
          prof.deletedAt || null,
          prof.createdAt || new Date().toISOString(),
          prof.updatedAt || new Date().toISOString(),
        ]
      })
      insertedProfesores++
    }
    
    // Insertar notas
    for (const nota of notas) {
      await client.execute({
        sql: `INSERT INTO notas (id, alumnoId, asignaturaId, nota, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          nota.id,
          nota.alumnoId,
          nota.asignaturaId,
          nota.nota,
          nota.createdAt || new Date().toISOString(),
          nota.updatedAt || new Date().toISOString(),
        ]
      })
      insertedNotas++
    }
    
    return NextResponse.json({
      success: true,
      message: 'Backup restaurado correctamente',
      resultado: {
        alumnos: insertedAlumnos,
        profesores: insertedProfesores,
        asignaturas: insertedAsignaturas,
        notas: insertedNotas,
      }
    })
  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json({ 
      error: 'Error al restaurar backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
