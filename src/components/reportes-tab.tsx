'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Users,
  BookOpen,
  Award,
  Download,
  BarChart3,
  IdCard,
  Search
} from 'lucide-react'
import { toast } from 'sonner'

interface Alumno {
  id: number
  numeroExpediente: number
  nombre: string
  ci: string
  genero: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  nombreIglesia: string | null
  nombrePastor: string | null
  tomaHuellaBiometrica: boolean
  entregaFoto: boolean
  pagoCuotas: string | null
  disposicionCampoMisionero: boolean
  habilidades: string | null
  notas?: { nota: number | null; asignatura: { id: number; nombre: string } }[]
  promedio?: number | null
}

interface Profesor {
  id: number
  nombre: string
  ci: string
  genero: string | null
  telefono: string | null
  email: string | null
  nombreIglesia: string | null
  asignatura?: { id: number; nombre: string } | null
}

interface Asignatura {
  id: number
  nombre: string
  codigo: string | null
}

// Helper function para agregar footer con QR centrado y dos firmas
function addFooterWithTwoSignatures(
  doc: ReturnType<typeof import('jspdf').jsPDF>,
  footerY: number
) {
  const fecha = new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  })
  
  // Fecha a la izquierda
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Fecha de emisión: ${fecha}`, 15, footerY)
  
  // QR centrado
  const qrSize = 20
  const qrX = 105 - (qrSize / 2) // Centrar en la página
  const qrY = footerY + 5
  
  try {
    doc.addImage('/images/qr.png', 'PNG', qrX, qrY, qrSize, qrSize)
  } catch {
    console.log('No se pudo cargar el QR')
  }
  
  // Dos líneas de firma después de un salto
  const firmaY = qrY + qrSize + 15
  
  // Primera línea (izquierda)
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text('_________________________', 45, firmaY)
  
  // Segunda línea (derecha)
  doc.text('_________________________', 115, firmaY)
}

export function ReportesTab() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlumno, setSelectedAlumno] = useState<string>('')
  const [selectedAsignatura, setSelectedAsignatura] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [alumRes, profRes, asigRes] = await Promise.all([
        fetch('/api/alumnos'),
        fetch('/api/profesores'),
        fetch('/api/asignaturas')
      ])
      const alumData = await alumRes.json()
      const profData = await profRes.json()
      const asigData = await asigRes.json()
      
      setAlumnos(alumRes.ok && Array.isArray(alumData) ? alumData : [])
      setProfesores(profRes.ok && Array.isArray(profData) ? profData : [])
      setAsignaturas(asigRes.ok && Array.isArray(asigData) ? asigData : [])
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // 1. CONSTANCIA DE ESTUDIO
  const generateConstancia = async () => {
    if (!selectedAlumno) {
      toast.error('Seleccione un alumno')
      return
    }

    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      const response = await fetch(`/api/expediente/${selectedAlumno}`)
      const data = await response.json()
      const alumno = data.alumno as Alumno

      const doc = new jsPDF()
      
      // Header con logo
      try {
        doc.addImage('/images/logo.png', 'PNG', 15, 10, 30, 30)
      } catch {
        console.log('No se pudo cargar el logo')
      }
      
      doc.setFontSize(22)
      doc.setTextColor(185, 28, 28)
      doc.text('SEMINARIO DCI', 105, 22, { align: 'center' })
      
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text('CONSTANCIA DE ESTUDIO', 105, 35, { align: 'center' })
      
      doc.setDrawColor(185, 28, 28)
      doc.setLineWidth(0.5)
      doc.line(15, 42, 195, 42)
      
      // Cuerpo de la constancia
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      
      const texto = `Quien suscribe, Director del SEMINARIO DCI, hace constar por medio del presente documento que:`
      
      doc.text(texto, 15, 55, { maxWidth: 180, align: 'justify' })
      
      // Datos del alumno destacados
      doc.setFontSize(14)
      doc.setTextColor(185, 28, 28)
      doc.text(alumno.nombre, 105, 72, { align: 'center' })
      
      doc.setFontSize(11)
      doc.setTextColor(80, 80, 80)
      doc.text(`Carnet de Identidad: ${alumno.ci}`, 105, 80, { align: 'center' })
      doc.text(`No. de Expediente: ${alumno.numeroExpediente}`, 105, 87, { align: 'center' })
      
      // Texto legal
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      const texto2 = `Es estudiante activo de esta institución educativa, cursando estudios en el programa de formación ministerial. Esta constancia se expide a solicitud del interesado para los fines que estime conveniente.`
      
      doc.text(texto2, 15, 102, { maxWidth: 180, align: 'justify' })
      
      // Datos adicionales
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Iglesia: ${alumno.nombreIglesia || 'No especificada'}`, 15, 125)
      doc.text(`Pastor: ${alumno.nombrePastor || 'No especificado'}`, 15, 132)
      
      // Footer con dos firmas
      addFooterWithTwoSignatures(doc, 150, 'Director', 'Seminario DCI', 'Secretaria', 'Seminario DCI')
      
      doc.save(`constancia_${alumno.nombre.replace(/\s+/g, '_')}.pdf`)
      toast.success('Constancia generada correctamente')
    } catch {
      toast.error('Error al generar la constancia')
    }
  }

  // 2. LISTA DE ALUMNOS
  const generateListaAlumnos = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      const doc = new jsPDF()
      
      // Header
      try {
        doc.addImage('/images/logo.png', 'PNG', 15, 10, 25, 25)
      } catch {
        console.log('No se pudo cargar el logo')
      }
      
      doc.setFontSize(18)
      doc.setTextColor(185, 28, 28)
      doc.text('SEMINARIO DCI', 105, 18, { align: 'center' })
      
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text('LISTA DE ALUMNOS', 105, 28, { align: 'center' })
      
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text(`Total: ${alumnos.length} alumnos`, 105, 35, { align: 'center' })
      
      doc.setDrawColor(185, 28, 28)
      doc.setLineWidth(0.5)
      doc.line(15, 40, 195, 40)
      
      // Tabla de alumnos
      const tableData = alumnos.map((a, i) => [
        (i + 1).toString(),
        a.numeroExpediente.toString(),
        a.nombre,
        a.ci,
        a.telefono || '-',
        a.nombreIglesia || '-'
      ])
      
      autoTable(doc, {
        startY: 45,
        head: [['No.', 'Exp.', 'Nombre Completo', 'CI', 'Teléfono', 'Iglesia']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 15 },
          2: { cellWidth: 55 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 50 }
        }
      })
      
      // Footer con dos firmas
      const footerY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
      addFooterWithTwoSignatures(doc, footerY, 'Director', 'Seminario DCI', 'Secretaria', 'Seminario DCI')
      
      doc.save('lista_alumnos.pdf')
      toast.success('Lista de alumnos generada')
    } catch {
      toast.error('Error al generar la lista')
    }
  }

  // 3. KARDEX ACADÉMICO
  const generateKardex = async () => {
    if (!selectedAlumno) {
      toast.error('Seleccione un alumno')
      return
    }

    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      const response = await fetch(`/api/expediente/${selectedAlumno}`)
      const data = await response.json()
      const alumno = data.alumno as Alumno

      const doc = new jsPDF()
      
      // Header con logo
      try {
        doc.addImage('/images/logo.png', 'PNG', 15, 10, 30, 30)
      } catch {
        console.log('No se pudo cargar el logo')
      }
      
      doc.setFontSize(20)
      doc.setTextColor(185, 28, 28)
      doc.text('SEMINARIO DCI', 105, 20, { align: 'center' })
      
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text('KARDEX ACADÉMICO', 105, 32, { align: 'center' })
      
      doc.setDrawColor(185, 28, 28)
      doc.setLineWidth(0.5)
      doc.line(15, 40, 195, 40)
      
      // Datos del alumno
      doc.setFontSize(12)
      doc.setTextColor(185, 28, 28)
      doc.text('DATOS DEL ESTUDIANTE', 15, 50)
      
      const studentData = [
        ['Nombre:', alumno.nombre],
        ['CI:', alumno.ci],
        ['No. Expediente:', alumno.numeroExpediente.toString()],
        ['Género:', alumno.genero === 'M' ? 'Masculino' : alumno.genero === 'F' ? 'Femenino' : '-'],
      ]
      
      autoTable(doc, {
        startY: 54,
        head: [],
        body: studentData,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 140 }
        }
      })
      
      // Tabla de calificaciones
      const yNotas = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.setTextColor(185, 28, 28)
      doc.text('HISTORIAL DE CALIFICACIONES', 15, yNotas)
      
      const gradesData = (alumno.notas || []).map((n, i) => [
        (i + 1).toString(),
        n.asignatura.nombre,
        n.nota !== null ? n.nota.toFixed(2) : '-',
        n.nota !== null ? (n.nota >= 60 ? 'APROBADO' : 'REPROBADO') : 'SIN NOTA'
      ])
      
      gradesData.push([
        '',
        'PROMEDIO GENERAL',
        alumno.promedio ? alumno.promedio.toFixed(2) : '-',
        ''
      ])
      
      autoTable(doc, {
        startY: yNotas + 4,
        head: [['No.', 'Asignatura', 'Nota', 'Estado']],
        body: gradesData,
        theme: 'grid',
        styles: { fontSize: 10, halign: 'center' },
        headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 95, halign: 'left' },
          2: { cellWidth: 30 },
          3: { cellWidth: 35 }
        }
      })
      
      // Footer con dos firmas
      const footerY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20
      addFooterWithTwoSignatures(doc, footerY, 'Director', 'Seminario DCI', 'Secretaria', 'Seminario DCI')
      
      doc.save(`kardex_${alumno.nombre.replace(/\s+/g, '_')}.pdf`)
      toast.success('Kardex generado correctamente')
    } catch {
      toast.error('Error al generar el kardex')
    }
  }

  // 4. REPORTE POR ASIGNATURA
  const generateReporteAsignatura = async () => {
    if (!selectedAsignatura) {
      toast.error('Seleccione una asignatura')
      return
    }

    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      // Filtrar notas de la asignatura seleccionada
      const asignatura = asignaturas.find(a => a.id === parseInt(selectedAsignatura))
      const notasAsignatura: { alumno: string; ci: string; nota: number | null }[] = []
      
      for (const alumno of alumnos) {
        if (alumno.notas) {
          const nota = alumno.notas.find(n => n.asignatura.id === parseInt(selectedAsignatura))
          if (nota || true) { // Incluir todos los alumnos
            notasAsignatura.push({
              alumno: alumno.nombre,
              ci: alumno.ci,
              nota: nota?.nota ?? null
            })
          }
        }
      }
      
      const doc = new jsPDF()
      
      // Header
      try {
        doc.addImage('/images/logo.png', 'PNG', 15, 10, 25, 25)
      } catch {
        console.log('No se pudo cargar el logo')
      }
      
      doc.setFontSize(18)
      doc.setTextColor(185, 28, 28)
      doc.text('SEMINARIO DCI', 105, 18, { align: 'center' })
      
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text('REPORTE DE CALIFICACIONES POR ASIGNATURA', 105, 28, { align: 'center' })
      
      doc.setFontSize(11)
      doc.setTextColor(100, 100, 100)
      doc.text(`Asignatura: ${asignatura?.nombre}`, 105, 35, { align: 'center' })
      
      doc.setDrawColor(185, 28, 28)
      doc.setLineWidth(0.5)
      doc.line(15, 40, 195, 40)
      
      // Estadísticas
      const conNota = notasAsignatura.filter(n => n.nota !== null)
      const promedio = conNota.length > 0 
        ? conNota.reduce((sum, n) => sum + (n.nota || 0), 0) / conNota.length 
        : 0
      const aprobados = conNota.filter(n => (n.nota || 0) >= 60).length
      const reprobados = conNota.filter(n => (n.nota || 0) < 60).length
      
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`Total alumnos: ${alumnos.length} | Con nota: ${conNota.length} | Promedio: ${promedio.toFixed(2)} | Aprobados: ${aprobados} | Reprobados: ${reprobados}`, 15, 48)
      
      // Tabla
      const tableData = notasAsignatura.map((n, i) => [
        (i + 1).toString(),
        n.alumno,
        n.ci,
        n.nota !== null ? n.nota.toFixed(2) : '-',
        n.nota !== null ? (n.nota >= 60 ? 'AP' : 'RP') : '-'
      ])
      
      autoTable(doc, {
        startY: 55,
        head: [['No.', 'Nombre del Alumno', 'CI', 'Nota', 'Estado']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 75 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 }
        }
      })
      
      // Footer con dos firmas
      const footerY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
      addFooterWithTwoSignatures(doc, footerY, 'Director', 'Seminario DCI', 'Secretaria', 'Seminario DCI')
      
      doc.save(`reporte_${asignatura?.nombre.replace(/\s+/g, '_')}.pdf`)
      toast.success('Reporte generado correctamente')
    } catch {
      toast.error('Error al generar el reporte')
    }
  }

  // 5. RESUMEN ESTADÍSTICO
  const generateEstadisticas = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      // Calcular estadísticas
      const totalAlumnos = alumnos.length
      const totalProfesores = profesores.length
      const totalAsignaturas = asignaturas.length
      
      const masculinos = alumnos.filter(a => a.genero === 'M').length
      const femeninos = alumnos.filter(a => a.genero === 'F').length
      
      const conHuella = alumnos.filter(a => a.tomaHuellaBiometrica).length
      const conFoto = alumnos.filter(a => a.entregaFoto).length
      const conCampoMisionero = alumnos.filter(a => a.disposicionCampoMisionero).length
      
      // Iglesia más frecuente
      const iglesias: Record<string, number> = {}
      alumnos.forEach(a => {
        if (a.nombreIglesia) {
          iglesias[a.nombreIglesia] = (iglesias[a.nombreIglesia] || 0) + 1
        }
      })
      const topIglesias = Object.entries(iglesias)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
      
      const doc = new jsPDF()
      
      // Header
      try {
        doc.addImage('/images/logo.png', 'PNG', 15, 10, 30, 30)
      } catch {
        console.log('No se pudo cargar el logo')
      }
      
      doc.setFontSize(20)
      doc.setTextColor(185, 28, 28)
      doc.text('SEMINARIO DCI', 105, 20, { align: 'center' })
      
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text('RESUMEN ESTADÍSTICO', 105, 32, { align: 'center' })
      
      doc.setDrawColor(185, 28, 28)
      doc.setLineWidth(0.5)
      doc.line(15, 40, 195, 40)
      
      // Resumen general
      doc.setFontSize(12)
      doc.setTextColor(185, 28, 28)
      doc.text('RESUMEN GENERAL', 15, 52)
      
      const generalData = [
        ['Total de Alumnos:', totalAlumnos.toString()],
        ['Total de Profesores:', totalProfesores.toString()],
        ['Total de Asignaturas:', totalAsignaturas.toString()],
      ]
      
      autoTable(doc, {
        startY: 56,
        head: [],
        body: generalData,
        theme: 'plain',
        styles: { fontSize: 11 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 120 }
        }
      })
      
      // Distribución por género
      const yGen = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.setTextColor(185, 28, 28)
      doc.text('DISTRIBUCIÓN POR GÉNERO', 15, yGen)
      
      const generoData = [
        ['Masculino:', masculinos.toString(), `${totalAlumnos > 0 ? ((masculinos / totalAlumnos) * 100).toFixed(1) : 0}%`],
        ['Femenino:', femeninos.toString(), `${totalAlumnos > 0 ? ((femeninos / totalAlumnos) * 100).toFixed(1) : 0}%`],
      ]
      
      autoTable(doc, {
        startY: yGen + 4,
        head: [],
        body: generoData,
        theme: 'plain',
        styles: { fontSize: 11 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: 40 }
        }
      })
      
      // Documentación
      const yDoc = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.setTextColor(185, 28, 28)
      doc.text('DOCUMENTACIÓN ENTREGADA', 15, yDoc)
      
      const docData = [
        ['Huella Biométrica:', `${conHuella} de ${totalAlumnos}`, `${totalAlumnos > 0 ? ((conHuella / totalAlumnos) * 100).toFixed(1) : 0}%`],
        ['Foto:', `${conFoto} de ${totalAlumnos}`, `${totalAlumnos > 0 ? ((conFoto / totalAlumnos) * 100).toFixed(1) : 0}%`],
        ['Campo Misionero:', `${conCampoMisionero} de ${totalAlumnos}`, `${totalAlumnos > 0 ? ((conCampoMisionero / totalAlumnos) * 100).toFixed(1) : 0}%`],
      ]
      
      autoTable(doc, {
        startY: yDoc + 4,
        head: [],
        body: docData,
        theme: 'plain',
        styles: { fontSize: 11 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 }
        }
      })
      
      // Top iglesias
      let lastY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
      if (topIglesias.length > 0) {
        const yIgl = lastY + 10
        doc.setFontSize(12)
        doc.setTextColor(185, 28, 28)
        doc.text('IGLESIAS CON MÁS ALUMNOS', 15, yIgl)
        
        const iglesiaData = topIglesias.map(([nombre, count]) => [nombre, count.toString()])
        
        autoTable(doc, {
          startY: yIgl + 4,
          head: [['Iglesia', 'Alumnos']],
          body: iglesiaData,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255] }
        })
        
        lastY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
      }
      
      // Footer con dos firmas
      const footerY = lastY + 20
      addFooterWithTwoSignatures(doc, footerY, 'Director', 'Seminario DCI', 'Secretaria', 'Seminario DCI')
      
      doc.save('resumen_estadistico.pdf')
      toast.success('Resumen estadístico generado')
    } catch {
      toast.error('Error al generar el resumen')
    }
  }

  // 6. CREDENCIAL DE ESTUDIANTE
  const generateCredencial = async () => {
    if (!selectedAlumno) {
      toast.error('Seleccione un alumno')
      return
    }

    try {
      const { jsPDF } = await import('jspdf')
      
      const alumno = alumnos.find(a => a.id === parseInt(selectedAlumno))
      if (!alumno) return
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98] // Tamaño estándar de credencial
      })
      
      // Fondo
      doc.setFillColor(185, 28, 28)
      doc.rect(0, 0, 85.6, 15, 'F')
      
      // Logo y título
      try {
        doc.addImage('/images/logo.png', 'PNG', 3, 2, 10, 10)
      } catch {
        console.log('No se pudo cargar el logo')
      }
      
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text('SEMINARIO DCI', 50, 9, { align: 'center' })
      
      // Datos del alumno
      doc.setFontSize(7)
      doc.setTextColor(0, 0, 0)
      doc.text('CREDENCIAL DE ESTUDIANTE', 50, 20, { align: 'center' })
      
      doc.setFontSize(9)
      doc.setTextColor(185, 28, 28)
      doc.text(alumno.nombre, 50, 28, { align: 'center' })
      
      doc.setFontSize(7)
      doc.setTextColor(0, 0, 0)
      doc.text(`CI: ${alumno.ci}`, 50, 34, { align: 'center' })
      doc.text(`Exp: ${alumno.numeroExpediente}`, 50, 39, { align: 'center' })
      
      // QR
      try {
        doc.addImage('/images/qr.png', 'PNG', 60, 42, 12, 12)
      } catch {
        console.log('No se pudo cargar el QR')
      }
      
      // Año
      doc.setFontSize(6)
      doc.setTextColor(100, 100, 100)
      doc.text(`Año: ${new Date().getFullYear()}`, 5, 52)
      
      doc.save(`credencial_${alumno.nombre.replace(/\s+/g, '_')}.pdf`)
      toast.success('Credencial generada correctamente')
    } catch {
      toast.error('Error al generar la credencial')
    }
  }

  const filteredAlumnos = alumnos.filter(a =>
    `${a.nombre} ${a.ci} ${a.numeroExpediente}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Centro de Reportes</CardTitle>
          <CardDescription>Genere documentos oficiales con logo y firma digital</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buscar Alumno</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, CI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Seleccionar Alumno</Label>
              <Select value={selectedAlumno} onValueChange={setSelectedAlumno}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredAlumnos.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {a.nombre} - {a.ci}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Seleccionar Asignatura</Label>
              <Select value={selectedAsignatura} onValueChange={setSelectedAsignatura}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {asignaturas.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {a.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Constancia de Estudio */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Constancia de Estudio</CardTitle>
                <CardDescription>Documento que certifica estudios</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Documento oficial para trámites bancarios, laborales u otros.
            </p>
            <Button onClick={generateConstancia} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Alumnos */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Lista de Alumnos</CardTitle>
                <CardDescription>Directorio completo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Listado general con datos de contacto de todos los alumnos.
            </p>
            <Button onClick={generateListaAlumnos} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
          </CardContent>
        </Card>

        {/* Kardex Académico */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Kardex Académico</CardTitle>
                <CardDescription>Historial de calificaciones</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Historial formal con todas las calificaciones del alumno.
            </p>
            <Button onClick={generateKardex} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
          </CardContent>
        </Card>

        {/* Reporte por Asignatura */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Notas por Asignatura</CardTitle>
                <CardDescription>Calificaciones grupales</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Todas las notas de una asignatura con estadísticas.
            </p>
            <Button onClick={generateReporteAsignatura} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
          </CardContent>
        </Card>

        {/* Resumen Estadístico */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Resumen Estadístico</CardTitle>
                <CardDescription>Datos generales</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Estadísticas generales: géneros, iglesias, documentación.
            </p>
            <Button onClick={generateEstadisticas} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
          </CardContent>
        </Card>

        {/* Credencial */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <IdCard className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Credencial</CardTitle>
                <CardDescription>Tarjeta de identificación</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Credencial de estudiante en formato tarjeta.
            </p>
            <Button onClick={generateCredencial} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
