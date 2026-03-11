import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// DELETE - Eliminar nota
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb()
    const { id } = await params
    await db.nota.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting nota:', error)
    return NextResponse.json({ error: 'Error al eliminar nota' }, { status: 500 })
  }
}
