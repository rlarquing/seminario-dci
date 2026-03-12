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
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(initialFormData)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        ...formData,
        numeroExpediente: parseInt(formData.numeroExpediente),
      }

      if (editingId) {
        await fetch(`/api/alumnos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Alumno actualizado correctamente')
      } else {
        await fetch('/api/alumnos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Alumno creado correctamente')
      }
      
      setIsDialogOpen(false)
      setFormData(initialFormData)
      setEditingId(null)
      fetchAlumnos()
    } catch {
      toast.error('Error al guardar el alumno')
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
    if (!confirm('¿Está seguro de eliminar este alumno?')) return
    
    try {
      await fetch(`/api/alumnos/${id}`, { method: 'DELETE' })
      toast.success('Alumno eliminado correctamente')
      fetchAlumnos()
    } catch {
      toast.error('Error al eliminar el alumno')
    }
  }

  const filteredAlumnos = alumnos.filter(alumno =>
    `${alumno.nombre} ${alumno.ci} ${alumno.numeroExpediente}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>
  }

  return (
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
                    <Label htmlFor="genero">Sexo *</Label>
                    <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })} required>
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
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pasaporte">No. Pasaporte *</Label>
                    <Input
                      id="pasaporte"
                      value={formData.pasaporte}
                      onChange={(e) => setFormData({ ...formData, pasaporte: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="direccion">Dirección Particular *</Label>
                    <Textarea
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="nombreIglesia">Nombre de la Iglesia y Dirección *</Label>
                    <Textarea
                      id="nombreIglesia"
                      value={formData.nombreIglesia}
                      onChange={(e) => setFormData({ ...formData, nombreIglesia: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombrePastor">Nombre del Pastor *</Label>
                    <Input
                      id="nombrePastor"
                      value={formData.nombrePastor}
                      onChange={(e) => setFormData({ ...formData, nombrePastor: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pagoCuotas">Pago de Cuotas (meses) *</Label>
                    <Input
                      id="pagoCuotas"
                      value={formData.pagoCuotas}
                      onChange={(e) => setFormData({ ...formData, pagoCuotas: e.target.value })}
                      placeholder="Ej: 12, 6, Pendiente"
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="habilidades">Habilidades *</Label>
                    <Textarea
                      id="habilidades"
                      value={formData.habilidades}
                      onChange={(e) => setFormData({ ...formData, habilidades: e.target.value })}
                      placeholder="Ej: Cocinero, maestro, electricista"
                      required
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
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, CI o expediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Exp.</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>CI</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Iglesia</TableHead>
                <TableHead>Cuotas</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlumnos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No hay alumnos registrados
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlumnos.map((alumno) => (
                  <TableRow key={alumno.id}>
                    <TableCell className="font-medium">{alumno.numeroExpediente}</TableCell>
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
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(alumno)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(alumno.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
