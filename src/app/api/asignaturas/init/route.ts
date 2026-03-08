import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Inicializar asignaturas por defecto
export async function POST() {
  try {
    const asignaturasExistentes = await db.asignatura.count()
    
    if (asignaturasExistentes > 0) {
      return NextResponse.json({ 
        message: 'Las asignaturas ya están inicializadas',
        count: asignaturasExistentes 
      })
    }
    
    const asignaturasDefault = [
      { nombre: 'Metodología de la Investigación', codigo: 'ASI-001' },
      { nombre: 'Liderazgo', codigo: 'ASI-002' },
      { nombre: 'Discipulado y Consolidación', codigo: 'ASI-003' },
      { nombre: 'Misiones Mundiales', codigo: 'ASI-004' },
      { nombre: 'Tu Iglesia puede cambiar el Mundo', codigo: 'ASI-005' },
      { nombre: 'Economía del Reino', codigo: 'ASI-006' },
      { nombre: 'Plantación de Iglesias', codigo: 'ASI-007' },
      { nombre: 'Evangelismo', codigo: 'ASI-008' },
    ]
    
    const result = await db.asignatura.createMany({
      data: asignaturasDefault
    })
    
    return NextResponse.json({ 
      message: 'Asignaturas inicializadas correctamente',
      count: result.count 
    })
  } catch (error) {
    console.error('Error initializing asignaturas:', error)
    return NextResponse.json({ error: 'Error al inicializar asignaturas' }, { status: 500 })
  }
}
