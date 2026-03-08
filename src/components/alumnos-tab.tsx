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
import { Plus, Pencil, Trash2, Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface Alumno {
  id: number
  nombre: string
  apellidos: string
  ci: string
  fechaNacimiento: string | null
  genero: string | null
  direccion: string | null
  pasaporte: string | null
  telefono: string | null
  movil: string | null
  email: string | null
  estadoCivil: string | null
  nombreIglesia: string | null
  nombrePastores: string | null
  cartaRecomendacion: boolean
  pagoMatricula: string | null
  disposicionCampoMisionero: boolean
  redesSociales: string | null
  tomaInformacionBiometrica: boolean
  numeroExpediente: number | null
}

const initialFormData = {
  nombre: '',
  apellidos: '',
  ci: '',
  fechaNacimiento: '',
  genero: '',
  direccion: '',
  pasaporte: '',
  telefono: '',
  movil: '',
  email: '',
  estadoCivil: '',
  nombreIglesia: '',
  nombrePastores: '',
  cartaRecomendacion: false,
  pagoMatricula: '',
  disposicionCampoMisionero: false,
  redesSociales: '',
  tomaInformacionBiometrica: false,
  numeroExpediente: '',
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
      setAlumnos(data)
    } catch (error) {
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
        numeroExpediente: formData.numeroExpediente ? parseInt(formData.numeroExpediente) : null,
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
    } catch (error) {
      toast.error('Error al guardar el alumno')
    }
  }

  const handleEdit = (alumno: Alumno) => {
    setFormData({
      nombre: alumno.nombre,
      apellidos: alumno.apellidos,
      ci: alumno.ci,
      fechaNacimiento: alumno.fechaNacimiento ? alumno.fechaNacimiento.split('T')[0] : '',
      genero: alumno.genero || '',
      direccion: alumno.direccion || '',
      pasaporte: alumno.pasaporte || '',
      telefono: alumno.telefono || '',
      movil: alumno.movil || '',
      email: alumno.email || '',
      estadoCivil: alumno.estadoCivil || '',
      nombreIglesia: alumno.nombreIglesia || '',
      nombrePastores: alumno.nombrePastores || '',
      cartaRecomendacion: alumno.cartaRecomendacion,
      pagoMatricula: alumno.pagoMatricula || '',
      disposicionCampoMisionero: alumno.disposicionCampoMisionero,
      redesSociales: alumno.redesSociales || '',
      tomaInformacionBiometrica: alumno.tomaInformacionBiometrica,
      numeroExpediente: alumno.numeroExpediente?.toString() || '',
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
    } catch (error) {
      toast.error('Error al eliminar el alumno')
    }
  }

  const filteredAlumnos = alumnos.filter(alumno =>
    `${alumno.nombre} ${alumno.apellidos} ${alumno.ci}`.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos *</Label>
                    <Input
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
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
                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genero">Género</Label>
                    <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estadoCivil">Estado Civil</Label>
                    <Select value={formData.estadoCivil} onValueChange={(value) => setFormData({ ...formData, estadoCivil: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Soltero">Soltero(a)</SelectItem>
                        <SelectItem value="Casado">Casado(a)</SelectItem>
                        <SelectItem value="Viudo">Viudo(a)</SelectItem>
                        <SelectItem value="Divorciado">Divorciado(a)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Textarea
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pasaporte">Pasaporte</Label>
                    <Input
                      id="pasaporte"
                      value={formData.pasaporte}
                      onChange={(e) => setFormData({ ...formData, pasaporte: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono Fijo</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="movil">Móvil</Label>
                    <Input
                      id="movil"
                      value={formData.movil}
                      onChange={(e) => setFormData({ ...formData, movil: e.target.value })}
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
                    <Label htmlFor="nombreIglesia">Nombre de la Iglesia</Label>
                    <Input
                      id="nombreIglesia"
                      value={formData.nombreIglesia}
                      onChange={(e) => setFormData({ ...formData, nombreIglesia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombrePastores">Nombre de los Pastores</Label>
                    <Input
                      id="nombrePastores"
                      value={formData.nombrePastores}
                      onChange={(e) => setFormData({ ...formData, nombrePastores: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pagoMatricula">Pago de Matrícula</Label>
                    <Select value={formData.pagoMatricula} onValueChange={(value) => setFormData({ ...formData, pagoMatricula: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pagado">Pagado</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Parcial">Parcial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redesSociales">Redes Sociales</Label>
                    <Input
                      id="redesSociales"
                      value={formData.redesSociales}
                      onChange={(e) => setFormData({ ...formData, redesSociales: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroExpediente">Número de Expediente</Label>
                    <Input
                      id="numeroExpediente"
                      type="number"
                      value={formData.numeroExpediente}
                      onChange={(e) => setFormData({ ...formData, numeroExpediente: e.target.value })}
                    />
                  </div>
                  
                  {/* Checkboxes */}
                  <div className="space-y-4 sm:col-span-2 border-t pt-4">
                    <h4 className="font-medium text-sm">Documentación y Requisitos</h4>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cartaRecomendacion"
                          checked={formData.cartaRecomendacion}
                          onCheckedChange={(checked) => setFormData({ ...formData, cartaRecomendacion: checked as boolean })}
                        />
                        <Label htmlFor="cartaRecomendacion" className="font-normal">Carta de Recomendación</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="disposicionCampoMisionero"
                          checked={formData.disposicionCampoMisionero}
                          onCheckedChange={(checked) => setFormData({ ...formData, disposicionCampoMisionero: checked as boolean })}
                        />
                        <Label htmlFor="disposicionCampoMisionero" className="font-normal">Disposición Campo Misionero</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="tomaInformacionBiometrica"
                          checked={formData.tomaInformacionBiometrica}
                          onCheckedChange={(checked) => setFormData({ ...formData, tomaInformacionBiometrica: checked as boolean })}
                        />
                        <Label htmlFor="tomaInformacionBiometrica" className="font-normal">Información Biométrica</Label>
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
              placeholder="Buscar por nombre o CI..."
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
                <TableHead className="w-12">No.</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>CI</TableHead>
                <TableHead>Iglesia</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Pago</TableHead>
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
                    <TableCell>{alumno.id}</TableCell>
                    <TableCell>{alumno.nombre} {alumno.apellidos}</TableCell>
                    <TableCell>{alumno.ci}</TableCell>
                    <TableCell>{alumno.nombreIglesia || '-'}</TableCell>
                    <TableCell>{alumno.movil || alumno.telefono || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        alumno.pagoMatricula === 'Pagado' ? 'bg-green-100 text-green-800' :
                        alumno.pagoMatricula === 'Pendiente' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alumno.pagoMatricula || 'Sin definir'}
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
