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
import { Download, Printer, Search } from 'lucide-react'
import { toast } from 'sonner'

interface Alumno {
  id: number
  numeroExpediente: number
  nombre: string
  ci: string
  genero: string | null
  direccion: string | null
  nombreIglesia: string | null
  nombrePastor: string | null
  notas: {
    id: number
    nota: number | null
    asignatura: {
      id: number
      nombre: string
    }
  }[]
}

interface CertificadoData {
  alumno: Alumno
  promedioGeneral: number | null
}

export function CertificadosTab() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlumno, setSelectedAlumno] = useState<string>('')
  const [certificadoData, setCertificadoData] = useState<CertificadoData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAlumnos()
  }, [])

  const fetchAlumnos = async () => {
    try {
      const response = await fetch('/api/alumnos')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        setAlumnos(data)
      } else {
        setAlumnos([])
        if (data.error) {
          toast.error(data.error)
        }
      }
    } catch {
      setAlumnos([])
      toast.error('Error al cargar los alumnos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedAlumno) {
      loadCertificado(selectedAlumno)
    }
  }, [selectedAlumno])

  const loadCertificado = async (alumnoId: string) => {
    try {
      const response = await fetch(`/api/certificado?alumnoId=${alumnoId}`)
      const data = await response.json()
      setCertificadoData(data)
    } catch {
      toast.error('Error al cargar el certificado')
    }
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!certificadoData) return

    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      const doc = new jsPDF()
      const alumno = certificadoData.alumno
      
      // Add logo
      try {
        doc.addImage('/images/logo.png', 'PNG', 15, 10, 30, 30)
      } catch {
        console.log('Could not load logo')
      }
      
      // Header
      doc.setFontSize(20)
      doc.setTextColor(185, 28, 28)
      doc.text('SEMINARIO DCI', 105, 20, { align: 'center' })
      
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text('CERTIFICACIÓN DE NOTAS', 105, 30, { align: 'center' })
      
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text('Sistema de Gestión Académica', 105, 38, { align: 'center' })
      
      // Line separator
      doc.setDrawColor(185, 28, 28)
      doc.setLineWidth(0.5)
      doc.line(15, 45, 195, 45)
      
      // Student Info
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('DATOS DEL ALUMNO', 15, 55)
      
      const studentData = [
        ['No. Expediente:', alumno.numeroExpediente.toString()],
        ['Nombre Completo:', alumno.nombre],
        ['Carnet de Identidad:', alumno.ci],
        ['Sexo:', alumno.genero === 'M' ? 'Masculino' : alumno.genero === 'F' ? 'Femenino' : '-'],
        ['Dirección:', alumno.direccion || '-'],
        ['Iglesia:', alumno.nombreIglesia || '-'],
        ['Pastor:', alumno.nombrePastor || '-'],
      ]
      
      autoTable(doc, {
        startY: 60,
        head: [],
        body: studentData,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 130 }
        }
      })
      
      // Grades table
      const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.text('CALIFICACIONES', 15, finalY)
      
      const gradesData = alumno.notas.map((nota, index) => [
        (index + 1).toString(),
        nota.asignatura.nombre,
        nota.nota !== null ? nota.nota.toFixed(2) : '-'
      ])
      
      gradesData.push([
        '',
        'PROMEDIO GENERAL',
        certificadoData.promedioGeneral ? certificadoData.promedioGeneral.toFixed(2) : '-'
      ])
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['No.', 'Asignatura', 'Nota']],
        body: gradesData,
        theme: 'grid',
        styles: { fontSize: 10, halign: 'center' },
        headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 120, halign: 'left' },
          2: { cellWidth: 40 }
        }
      })
      
      // Footer
      const footerY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`Fecha de emisión: ${getCurrentDate()}`, 15, footerY)
      
      // Signature area
      doc.text('_________________________', 150, footerY + 20)
      doc.setFontSize(8)
      doc.text('Firma del Director', 150, footerY + 25)
      
      doc.save(`certificado_${alumno.nombre.replace(/\s+/g, '_')}.pdf`)
      toast.success('PDF generado correctamente')
    } catch {
      toast.error('Error al generar el PDF')
    }
  }

  const filteredAlumnos = alumnos.filter(alumno =>
    `${alumno.nombre} ${alumno.ci} ${alumno.numeroExpediente}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Selector de Alumno */}
      <Card>
        <CardHeader>
          <CardTitle>Generación de Certificados</CardTitle>
          <CardDescription>Seleccione un alumno para generar su certificado de notas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Buscar Alumno</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, CI o expediente..."
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
                  <SelectValue placeholder="Seleccione un alumno" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAlumnos.map(alumno => (
                    <SelectItem key={alumno.id} value={alumno.id.toString()}>
                      Exp. {alumno.numeroExpediente} - {alumno.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista Previa del Certificado */}
      {certificadoData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Vista Previa del Certificado</CardTitle>
                <CardDescription>Certificado de notas del alumno</CardDescription>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Certificado Visual */}
            <div id="certificado" className="bg-white border-2 border-gray-200 rounded-lg p-8 max-w-4xl mx-auto shadow-lg print:shadow-none print:border-none">
              {/* Header con Logo */}
              <div className="flex items-center justify-center gap-4 mb-6 border-b-2 border-red-600 pb-4">
                <img src="/images/logo.png" alt="Logo DCI" className="w-20 h-20 object-contain" />
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-red-600">SEMINARIO DCI</h1>
                  <h2 className="text-xl font-semibold mt-1">CERTIFICACIÓN DE NOTAS</h2>
                  <p className="text-sm text-gray-500">Sistema de Gestión Académica</p>
                </div>
              </div>

              {/* Datos del Alumno */}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 text-red-600 border-b border-gray-200 pb-1">
                  DATOS DEL ALUMNO
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex">
                    <span className="font-semibold w-40">No. Expediente:</span>
                    <span>{certificadoData.alumno.numeroExpediente}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-40">Nombre Completo:</span>
                    <span>{certificadoData.alumno.nombre}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-40">Carnet de Identidad:</span>
                    <span>{certificadoData.alumno.ci}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-40">Sexo:</span>
                    <span>{certificadoData.alumno.genero === 'M' ? 'Masculino' : certificadoData.alumno.genero === 'F' ? 'Femenino' : '-'}</span>
                  </div>
                  <div className="flex md:col-span-2">
                    <span className="font-semibold w-40">Dirección:</span>
                    <span>{certificadoData.alumno.direccion || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-40">Iglesia:</span>
                    <span>{certificadoData.alumno.nombreIglesia || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-40">Pastor:</span>
                    <span>{certificadoData.alumno.nombrePastor || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Tabla de Notas */}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 text-red-600 border-b border-gray-200 pb-1">
                  CALIFICACIONES
                </h3>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-red-600 text-white">
                      <th className="border border-gray-300 p-2 w-16 text-center">No.</th>
                      <th className="border border-gray-300 p-2 text-left">Asignatura</th>
                      <th className="border border-gray-300 p-2 w-24 text-center">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificadoData.alumno.notas.map((nota, index) => (
                      <tr key={nota.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 p-2">{nota.asignatura.nombre}</td>
                        <td className="border border-gray-300 p-2 text-center font-semibold">
                          {nota.nota !== null ? nota.nota.toFixed(2) : '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-200 font-bold">
                      <td className="border border-gray-300 p-2 text-center" colSpan={2}>
                        PROMEDIO GENERAL
                      </td>
                      <td className="border border-gray-300 p-2 text-center text-red-600 text-lg">
                        {certificadoData.promedioGeneral ? certificadoData.promedioGeneral.toFixed(2) : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-8 flex justify-between items-end">
                <div className="text-sm text-gray-500">
                  <p>Fecha de emisión: {getCurrentDate()}</p>
                </div>
                <div className="text-center">
                  <img src="/images/qr.png" alt="QR" className="w-20 h-20 mx-auto mb-2" />
                  <div className="border-t border-gray-400 pt-2 mt-4">
                    <p className="text-sm font-semibold">Firma del Director</p>
                    <p className="text-xs text-gray-500">Seminario DCI</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
