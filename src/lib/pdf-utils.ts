import type { jsPDF } from 'jspdf'

// Colores del tema
export const COLORS = {
  primary: [185, 28, 28] as [number, number, number],    // Rojo DCI
  black: [0, 0, 0] as [number, number, number],
  gray: [100, 100, 100] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

// Datos de la institución
export const INSTITUCION = {
  nombre: 'SEMINARIO DCI',
  subtitulo: 'Sistema de Gestión Académica',
  direccion: 'Av. Principal #123, Ciudad',
  telefono: '+1 234 567 890',
}

// Agregar header estándar con logo
export async function addHeader(
  doc: jsPDF, 
  titulo: string, 
  subtitulo?: string
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Intentar agregar logo
  try {
    // Logo a la izquierda
    doc.addImage('/images/logo.png', 'PNG', 15, 8, 28, 28)
  } catch (e) {
    console.log('No se pudo cargar el logo:', e)
  }
  
  // Título principal
  doc.setFontSize(20)
  doc.setTextColor(...COLORS.primary)
  doc.text(INSTITUCION.nombre, pageWidth / 2, 18, { align: 'center' })
  
  // Título del documento
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.black)
  doc.text(titulo, pageWidth / 2, 28, { align: 'center' })
  
  // Subtítulo opcional
  if (subtitulo) {
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.gray)
    doc.text(subtitulo, pageWidth / 2, 35, { align: 'center' })
  }
  
  // Línea separadora
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(15, subtitulo ? 40 : 36, pageWidth - 15, subtitulo ? 40 : 36)
  
  return subtitulo ? 48 : 44
}

// Agregar footer con QR y firma
export async function addFooter(
  doc: jsPDF,
  startY?: number
): Promise<void> {
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Si no hay startY, usar la parte inferior de la página
  const footerY = startY || pageHeight - 50
  
  // Fecha de emisión
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.gray)
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
  doc.text(`Fecha de emisión: ${fecha}`, 15, footerY)
  
  // Número de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.gray)
    doc.setPage(i)
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }
  
  // QR Code
  try {
    doc.addImage('/images/qr.png', 'PNG', pageWidth - 45, footerY - 5, 25, 25)
  } catch (e) {
    console.log('No se pudo cargar el QR:', e)
  }
  
  // Firma
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.black)
  doc.text('_________________________', pageWidth - 75, footerY + 25)
  doc.setFontSize(8)
  doc.text('Firma del Director', pageWidth - 60, footerY + 30, { align: 'center' })
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.gray)
  doc.text(INSTITUCION.nombre, pageWidth - 60, footerY + 35, { align: 'center' })
}

// Agregar sección con título
export function addSection(
  doc: jsPDF,
  title: string,
  startY: number
): number {
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.primary)
  doc.text(title, 15, startY)
  
  // Línea debajo del título
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(15, startY + 2, 195, startY + 2)
  
  doc.setTextColor(...COLORS.black)
  return startY + 8
}

// Formatear género
export function formatGenero(genero: string | null): string {
  if (genero === 'M') return 'Masculino'
  if (genero === 'F') return 'Femenino'
  return '-'
}

// Formatear fecha
export function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Formatear nota
export function formatNota(nota: number | null): string {
  if (nota === null || nota === undefined) return '-'
  return nota.toFixed(2)
}
