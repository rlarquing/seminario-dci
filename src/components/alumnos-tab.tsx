'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2, Search, FileDown, Eye, RotateCcw, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Alumno {
  id: number
  numeroExpediente: number
  nombre: string
  ci: string
  telefono: string | null
  email: string | null
  pasaporte: string | null
  direccion: string | null
  genero: string | null
  nombreIglesia: string | null
  nombrePastor: string | null
  tomaHuellaBiometrica: boolean
  entregaFoto: boolean
  pagoCuotas: string | null
  disposicionCampoMisionero: boolean
  habilidades: string | null
  activo?: boolean
  deletedAt?: string | null
  notas?: { nota: number | null; asignatura: { nombre: string } }[]
  promedio?: number | null
}

const initialFormData = {
  numeroExpediente: '',
  nombre: '',
  ci: '',
  telefono: '',
  email: '',
  pasaporte: '',
  direccion: '',
  genero: '',
  nombreIglesia: '',
  nombrePastor: '',
  tomaHuellaBiometrica: false,
  entregaFoto: false,
  pagoCuotas: '',
  disposicionCampoMisionero: false,
  habilidades: '',
}

export function AlumnosTab() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewingAlumno, setViewingAlumno] = useState<Alumno | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [showDeleted, setShowDeleted] = useState(false)

  useEffect(() => {
    fetchAlumnos()
  }, [])

  const fetchAlumnos = async (onlyDeleted = false) => {
    try {
      const url = onlyDeleted 
        ? '/api/alumnos?onlyDeleted=true' 
        : '/api/alumnos'
      const response = await fetch(url)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación manual de campos requeridos
    if (!formData.numeroExpediente.trim()) {
      toast.error('El número de expediente es requerido')
      return
    }
    if (isNaN(parseInt(formData.numeroExpediente))) {
      toast.error('El número de expediente debe ser un número válido')
      return
    }
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    if (!formData.ci.trim()) {
      toast.error('El carnet de identidad es requerido')
      return
    }
    
    try {
      // Limpiar datos: convertir strings vacíos a null
      const payload = {
        numeroExpediente: parseInt(formData.numeroExpediente),
        nombre: formData.nombre.trim(),
        ci: formData.ci.trim(),
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim() || null,
        pasaporte: formData.pasaporte.trim() || null,
        direccion: formData.direccion.trim() || null,
        genero: formData.genero || null,
        nombreIglesia: formData.nombreIglesia.trim() || null,
        nombrePastor: formData.nombrePastor.trim() || null,
        tomaHuellaBiometrica: formData.tomaHuellaBiometrica || false,
        entregaFoto: formData.entregaFoto || false,
        pagoCuotas: formData.pagoCuotas.trim() || null,
        disposicionCampoMisionero: formData.disposicionCampoMisionero || false,
        habilidades: formData.habilidades.trim() || null,
      }

      console.log('Enviando datos del alumno:', payload)

      if (editingId) {
        const response = await fetch(`/api/alumnos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (response.ok) {
          toast.success('Alumno actualizado correctamente')
        } else {
          const data = await response.json()
          console.error('Error al actualizar:', data)
          toast.error(data.error || 'Error al actualizar')
          return
        }
      } else {
        const response = await fetch('/api/alumnos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (response.ok) {
          toast.success('Alumno creado correctamente')
        } else {
          const data = await response.json()
          console.error('Error al crear:', data)
          toast.error(data.error || 'Error al crear')
          return
        }
      }
      
      setIsDialogOpen(false)
      setFormData(initialFormData)
      setEditingId(null)
      // Limpiar cache del service worker
      if ('caches' in window) {
        const cache = await caches.open('seminario-dci-v2')
        await cache.delete('/api/alumnos')
      }
      fetchAlumnos(showDeleted)
    } catch (error) {
      console.error('Error al guardar alumno:', error)
      toast.error('Error al guardar el alumno: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  const handleEdit = (alumno: Alumno) => {
    setFormData({
      numeroExpediente: alumno.numeroExpediente.toString(),
      nombre: alumno.nombre,
      ci: alumno.ci,
      telefono: alumno.telefono || '',
      email: alumno.email || '',
      pasaporte: alumno.pasaporte || '',
      direccion: alumno.direccion || '',
      genero: alumno.genero || '',
      nombreIglesia: alumno.nombreIglesia || '',
      nombrePastor: alumno.nombrePastor || '',
      tomaHuellaBiometrica: alumno.tomaHuellaBiometrica,
      entregaFoto: alumno.entregaFoto,
      pagoCuotas: alumno.pagoCuotas || '',
      disposicionCampoMisionero: alumno.disposicionCampoMisionero,
      habilidades: alumno.habilidades || '',
    })
    setEditingId(alumno.id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este alumno? El registro se moverá a la papelera y podrá ser restaurado.')) return
    
    try {
      const response = await fetch(`/api/alumnos/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || 'Alumno eliminado correctamente')
        // Limpiar cache del service worker
        if ('caches' in window) {
          const cache = await caches.open('seminario-dci-v2')
          await cache.delete('/api/alumnos')
        }
        fetchAlumnos(showDeleted)
      } else {
        toast.error(data.error || 'Error al eliminar el alumno')
      }
    } catch {
      toast.error('Error al eliminar el alumno')
    }
  }

  const handleRestore = async (id: number) => {
    if (!confirm('¿Está seguro de restaurar este alumno?')) return
    
    try {
      const response = await fetch(`/api/alumnos/${id}`, { method: 'PATCH' })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || 'Alumno restaurado correctamente')
        // Limpiar cache del service worker
        if ('caches' in window) {
          const cache = await caches.open('seminario-dci-v2')
          await cache.delete('/api/alumnos')
        }
        fetchAlumnos(true)
      } else {
        toast.error(data.error || 'Error al restaurar el alumno')
      }
    } catch {
      toast.error('Error al restaurar el alumno')
    }
  }

  const handleViewExpediente = async (alumno: Alumno) => {
    try {
      const response = await fetch(`/api/expediente/${alumno.id}`)
      const data = await response.json()
      if (response.ok) {
        setViewingAlumno(data.alumno)
        setIsViewDialogOpen(true)
      } else {
        toast.error('Error al cargar el expediente')
      }
    } catch {
      toast.error('Error al cargar el expediente')
    }
  }

  const handleExportPDF = async (alumno: Alumno) => {
    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      // Fetch complete data
      const response = await fetch(`/api/expediente/${alumno.id}`)
      const data = await response.json()
      const alumnoData = data.alumno

      const doc = new jsPDF()
      
      // Header con Logo
      try {
        doc.addImage('/images/logo.png', 'PNG', 15, 8, 28, 28)
      } catch {
        console.log('No se pudo cargar el logo')
      }
      
      doc.setFontSize(20)
      doc.setTextColor(185, 28, 28)
      doc.text('SEMINARIO DCI', 105, 18, { align: 'center' })
      
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text('EXPEDIENTE DEL ALUMNO', 105, 28, { align: 'center' })
      
      // Línea separadora
      doc.setDrawColor(185, 28, 28)
      doc.setLineWidth(0.5)
      doc.line(15, 38, 195, 38)
      
      // Información Personal
      doc.setFontSize(14)
      doc.setTextColor(185, 28, 28)
      doc.text('DATOS PERSONALES', 15, 48)
      
      const personalData = [
        ['No. Expediente:', alumnoData.numeroExpediente.toString()],
        ['Nombre Completo:', alumnoData.nombre],
        ['Carnet de Identidad:', alumnoData.ci],
        ['Pasaporte:', alumnoData.pasaporte || '-'],
        ['Sexo:', alumnoData.genero === 'M' ? 'Masculino' : alumnoData.genero === 'F' ? 'Femenino' : '-'],
        ['Teléfono:', alumnoData.telefono || '-'],
        ['Email:', alumnoData.email || '-'],
        ['Dirección:', alumnoData.direccion || '-'],
      ]
      
      autoTable(doc, {
        startY: 52,
        head: [],
        body: personalData,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 45 },
          1: { cellWidth: 135 }
        }
      })
      
      // Información Eclesiástica
      const finalY1 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      doc.setFontSize(14)
      doc.setTextColor(185, 28, 28)
      doc.text('INFORMACIÓN ECLESIÁSTICA', 15, finalY1)
      
      const ecclesialData = [
        ['Iglesia:', alumnoData.nombreIglesia || '-'],
        ['Pastor:', alumnoData.nombrePastor || '-'],
        ['Campo Misionero:', alumnoData.disposicionCampoMisionero ? 'Sí' : 'No'],
        ['Habilidades:', alumnoData.habilidades || '-'],
      ]
      
      autoTable(doc, {
        startY: finalY1 + 4,
        head: [],
        body: ecclesialData,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 45 },
          1: { cellWidth: 135 }
        }
      })
      
      // Documentación
      const finalY2 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      doc.setFontSize(14)
      doc.setTextColor(185, 28, 28)
      doc.text('DOCUMENTACIÓN Y PAGOS', 15, finalY2)
      
      const docData = [
        ['Huella Biométrica:', alumnoData.tomaHuellaBiometrica ? '✓ Entregada' : '✗ Pendiente'],
        ['Foto:', alumnoData.entregaFoto ? '✓ Entregada' : '✗ Pendiente'],
        ['Pago de Cuotas:', alumnoData.pagoCuotas ? `${alumnoData.pagoCuotas} mes(es)` : 'Sin definir'],
      ]
      
      autoTable(doc, {
        startY: finalY2 + 4,
        head: [],
        body: docData,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 45 },
          1: { cellWidth: 135 }
        }
      })
      
      // Notas (si hay)
      if (alumnoData.notas && alumnoData.notas.length > 0) {
        const finalY3 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
        doc.setFontSize(14)
        doc.setTextColor(185, 28, 28)
        doc.text('CALIFICACIONES', 15, finalY3)
        
        const gradesData = alumnoData.notas.map((n: { nota: number | null; asignatura: { nombre: string } }, i: number) => [
          (i + 1).toString(),
          n.asignatura.nombre,
          n.nota !== null ? n.nota.toFixed(2) : '-'
        ])
        
        // Agregar promedio
        gradesData.push([
          '',
          'PROMEDIO GENERAL',
          alumnoData.promedio ? alumnoData.promedio.toFixed(2) : '-'
        ])
        
        autoTable(doc, {
          startY: finalY3 + 4,
          head: [['No.', 'Asignatura', 'Nota']],
          body: gradesData,
          theme: 'grid',
          styles: { fontSize: 10, halign: 'center' },
          headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255] },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 120, halign: 'left' },
            2: { cellWidth: 30 }
          }
        })
      }
      
      // Footer con QR y Firma
      const footerY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY 
        ? (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20 
        : 220
      
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })}`, 15, footerY)
      
      // QR Code
      try {
        doc.addImage('/images/qr.png', 'PNG', 155, footerY - 5, 25, 25)
      } catch {
        console.log('No se pudo cargar el QR')
      }
      
      // Firma
      doc.setTextColor(0, 0, 0)
      doc.text('_________________________', 140, footerY + 25)
      doc.setFontSize(9)
      doc.text('Firma del Director', 155, footerY + 30, { align: 'center' })
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Seminario DCI', 155, footerY + 35, { align: 'center' })
      
      // Guardar
      doc.save(`expediente_${alumnoData.nombre.replace(/\s+/g, '_')}.pdf`)
      toast.success('PDF generado correctamente')
      
    } catch (error) {
      console.error('Error generating PDF:', error)
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
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Gestión de Alumnos</CardTitle>
              <CardDescription>Administre la información personal de los alumnos</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setFormData(initialFormData); setEditingId(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Alumno
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Alumno' : 'Nuevo Alumno'}</DialogTitle>
                  <DialogDescription>
                    Complete la información personal del alumno
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="numeroExpediente">No. Expediente *</Label>
                      <Input
                        id="numeroExpediente"
                        type="number"
                        value={formData.numeroExpediente}
                        onChange={(e) => setFormData({ ...formData, numeroExpediente: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ci">Carnet de Identidad *</Label>
                      <Input
                        id="ci"
                        value={formData.ci}
                        onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="nombre">Nombre Completo *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genero">Sexo</Label>
                      <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pasaporte">No. Pasaporte</Label>
                      <Input
                        id="pasaporte"
                        value={formData.pasaporte}
                        onChange={(e) => setFormData({ ...formData, pasaporte: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="direccion">Dirección Particular</Label>
                      <Textarea
                        id="direccion"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="nombreIglesia">Nombre de la Iglesia y Dirección</Label>
                      <Textarea
                        id="nombreIglesia"
                        value={formData.nombreIglesia}
                        onChange={(e) => setFormData({ ...formData, nombreIglesia: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombrePastor">Nombre del Pastor</Label>
                      <Input
                        id="nombrePastor"
                        value={formData.nombrePastor}
                        onChange={(e) => setFormData({ ...formData, nombrePastor: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pagoCuotas">Pago de Cuotas (meses)</Label>
                      <Input
                        id="pagoCuotas"
                        value={formData.pagoCuotas}
                        onChange={(e) => setFormData({ ...formData, pagoCuotas: e.target.value })}
                        placeholder="Ej: 12, 6, Pendiente"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="habilidades">Habilidades</Label>
                      <Textarea
                        id="habilidades"
                        value={formData.habilidades}
                        onChange={(e) => setFormData({ ...formData, habilidades: e.target.value })}
                        placeholder="Ej: Cocinero, maestro, electricista"
                      />
                    </div>
                    
                    {/* Checkboxes */}
                    <div className="space-y-4 sm:col-span-2 border-t pt-4">
                      <h4 className="font-medium text-sm">Documentación y Requisitos</h4>
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="tomaHuellaBiometrica"
                            checked={formData.tomaHuellaBiometrica}
                            onCheckedChange={(checked) => setFormData({ ...formData, tomaHuellaBiometrica: checked as boolean })}
                          />
                          <Label htmlFor="tomaHuellaBiometrica" className="font-normal">Huella Biométrica</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="entregaFoto"
                            checked={formData.entregaFoto}
                            onCheckedChange={(checked) => setFormData({ ...formData, entregaFoto: checked as boolean })}
                          />
                          <Label htmlFor="entregaFoto" className="font-normal">Entrega de Foto</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="disposicionCampoMisionero"
                            checked={formData.disposicionCampoMisionero}
                            onCheckedChange={(checked) => setFormData({ ...formData, disposicionCampoMisionero: checked as boolean })}
                          />
                          <Label htmlFor="disposicionCampoMisionero" className="font-normal">Campo Misionero</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingId ? 'Actualizar' : 'Guardar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, CI o expediente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showDeleted ? "destructive" : "outline"}
              size="sm"
              onClick={() => {
                setShowDeleted(!showDeleted)
                fetchAlumnos(!showDeleted)
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              {showDeleted ? 'Ver Activos' : 'Ver Eliminados'}
            </Button>
          </div>
          
          {showDeleted && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                <strong>Papelera:</strong> Aquí puede ver y restaurar los alumnos eliminados.
              </p>
            </div>
          )}
          
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>No. Exp.</TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>CI</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Iglesia</TableHead>
                  <TableHead>Cuotas</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlumnos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {showDeleted ? 'No hay alumnos eliminados' : 'No hay alumnos registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlumnos.map((alumno, index) => (
                    <TableRow key={alumno.id} className={showDeleted ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{alumno.numeroExpediente}</TableCell>
                      <TableCell>{alumno.nombre}</TableCell>
                      <TableCell>{alumno.ci}</TableCell>
                      <TableCell>{alumno.telefono || '-'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{alumno.nombreIglesia || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          alumno.pagoCuotas && !isNaN(parseInt(alumno.pagoCuotas)) ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alumno.pagoCuotas ? `${alumno.pagoCuotas} mes(es)` : 'Sin definir'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {showDeleted ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="Ver Expediente" onClick={() => handleViewExpediente(alumno)}>
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Restaurar" onClick={() => handleRestore(alumno.id)}>
                              <RotateCcw className="h-4 w-4 text-green-500" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="Ver Expediente" onClick={() => handleViewExpediente(alumno)}>
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Exportar PDF" onClick={() => handleExportPDF(alumno)}>
                              <FileDown className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Editar" onClick={() => handleEdit(alumno)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Eliminar" onClick={() => handleDelete(alumno.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para ver expediente */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expediente del Alumno</DialogTitle>
          </DialogHeader>
          {viewingAlumno && (
            <div className="space-y-6">
              {/* Datos Personales */}
              <div>
                <h3 className="font-bold text-lg text-red-600 border-b pb-1 mb-3">Datos Personales</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-semibold">No. Expediente:</span> {viewingAlumno.numeroExpediente}</div>
                  <div><span className="font-semibold">CI:</span> {viewingAlumno.ci}</div>
                  <div className="col-span-2"><span className="font-semibold">Nombre:</span> {viewingAlumno.nombre}</div>
                  <div><span className="font-semibold">Sexo:</span> {viewingAlumno.genero === 'M' ? 'Masculino' : viewingAlumno.genero === 'F' ? 'Femenino' : '-'}</div>
                  <div><span className="font-semibold">Teléfono:</span> {viewingAlumno.telefono || '-'}</div>
                  <div><span className="font-semibold">Email:</span> {viewingAlumno.email || '-'}</div>
                  <div><span className="font-semibold">Pasaporte:</span> {viewingAlumno.pasaporte || '-'}</div>
                  <div className="col-span-2"><span className="font-semibold">Dirección:</span> {viewingAlumno.direccion || '-'}</div>
                </div>
              </div>

              {/* Datos Eclesiásticos */}
              <div>
                <h3 className="font-bold text-lg text-red-600 border-b pb-1 mb-3">Datos Eclesiásticos</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2"><span className="font-semibold">Iglesia:</span> {viewingAlumno.nombreIglesia || '-'}</div>
                  <div><span className="font-semibold">Pastor:</span> {viewingAlumno.nombrePastor || '-'}</div>
                  <div><span className="font-semibold">Campo Misionero:</span> {viewingAlumno.disposicionCampoMisionero ? 'Sí' : 'No'}</div>
                  <div className="col-span-2"><span className="font-semibold">Habilidades:</span> {viewingAlumno.habilidades || '-'}</div>
                </div>
              </div>

              {/* Documentación */}
              <div>
                <h3 className="font-bold text-lg text-red-600 border-b pb-1 mb-3">Documentación</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full ${viewingAlumno.tomaHuellaBiometrica ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    Huella Biométrica
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full ${viewingAlumno.entregaFoto ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    Foto
                  </div>
                  <div><span className="font-semibold">Cuotas:</span> {viewingAlumno.pagoCuotas ? `${viewingAlumno.pagoCuotas} mes(es)` : '-'}</div>
                </div>
              </div>

              {/* Notas */}
              {viewingAlumno.notas && viewingAlumno.notas.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg text-red-600 border-b pb-1 mb-3">Calificaciones</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asignatura</TableHead>
                        <TableHead className="text-right">Nota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingAlumno.notas.map((n, i) => (
                        <TableRow key={i}>
                          <TableCell>{n.asignatura.nombre}</TableCell>
                          <TableCell className="text-right font-semibold">{n.nota !== null ? n.nota.toFixed(2) : '-'}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-100">
                        <TableCell className="font-bold">PROMEDIO</TableCell>
                        <TableCell className="text-right font-bold text-red-600">{viewingAlumno.promedio?.toFixed(2) || '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => handleExportPDF(viewingAlumno)}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
