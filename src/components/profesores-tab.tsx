'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Plus, Pencil, Trash2, Search, RotateCcw, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Profesor {
  id: number
  nombre: string
  ci: string
  telefono: string | null
  email: string | null
  genero: string | null
  nombreIglesia: string | null
  nombrePastor: string | null
  tomaHuellaBiometrica: boolean
  entregaFoto: boolean
  asignaturaId: number | null
  asignatura?: { id: number; nombre: string } | null
  activo?: boolean
  deletedAt?: string | null
}

interface Asignatura {
  id: number
  nombre: string
  codigo: string | null
}

const initialFormData = {
  nombre: '',
  ci: '',
  telefono: '',
  email: '',
  genero: '',
  nombreIglesia: '',
  nombrePastor: '',
  tomaHuellaBiometrica: false,
  entregaFoto: false,
  asignaturaId: '',
}

export function ProfesoresTab() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [showDeleted, setShowDeleted] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (onlyDeleted = false) => {
    try {
      const profUrl = onlyDeleted 
        ? '/api/profesores?onlyDeleted=true' 
        : '/api/profesores'
      
      const [profRes, asigRes] = await Promise.all([
        fetch(profUrl),
        fetch('/api/asignaturas')
      ])
      const profData = await profRes.json()
      const asigData = await asigRes.json()
      
      setProfesores(profRes.ok && Array.isArray(profData) ? profData : [])
      setAsignaturas(asigRes.ok && Array.isArray(asigData) ? asigData : [])
      
      if (!profRes.ok && profData.error) {
        toast.error(profData.error)
      }
      if (!asigRes.ok && asigData.error) {
        toast.error(asigData.error)
      }
    } catch {
      setProfesores([])
      setAsignaturas([])
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        ...formData,
        asignaturaId: formData.asignaturaId ? parseInt(formData.asignaturaId) : null,
      }

      if (editingId) {
        await fetch(`/api/profesores/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Profesor actualizado correctamente')
      } else {
        await fetch('/api/profesores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Profesor creado correctamente')
      }
      
      setIsDialogOpen(false)
      setFormData(initialFormData)
      setEditingId(null)
      fetchData(showDeleted)
    } catch {
      toast.error('Error al guardar el profesor')
    }
  }

  const handleEdit = (profesor: Profesor) => {
    setFormData({
      nombre: profesor.nombre,
      ci: profesor.ci,
      telefono: profesor.telefono || '',
      email: profesor.email || '',
      genero: profesor.genero || '',
      nombreIglesia: profesor.nombreIglesia || '',
      nombrePastor: profesor.nombrePastor || '',
      tomaHuellaBiometrica: profesor.tomaHuellaBiometrica,
      entregaFoto: profesor.entregaFoto,
      asignaturaId: profesor.asignaturaId?.toString() || '',
    })
    setEditingId(profesor.id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este profesor? El registro se moverá a la papelera y podrá ser restaurado.')) return
    
    try {
      const response = await fetch(`/api/profesores/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || 'Profesor eliminado correctamente')
        fetchData(showDeleted)
      } else {
        toast.error(data.error || 'Error al eliminar el profesor')
      }
    } catch {
      toast.error('Error al eliminar el profesor')
    }
  }

  const handleRestore = async (id: number) => {
    if (!confirm('¿Está seguro de restaurar este profesor?')) return
    
    try {
      const response = await fetch(`/api/profesores/${id}`, { method: 'PATCH' })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || 'Profesor restaurado correctamente')
        fetchData(true)
      } else {
        toast.error(data.error || 'Error al restaurar el profesor')
      }
    } catch {
      toast.error('Error al restaurar el profesor')
    }
  }

  const filteredProfesores = profesores.filter(profesor =>
    `${profesor.nombre} ${profesor.ci}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Gestión de Profesores</CardTitle>
            <CardDescription>Administre la información de los profesores y sus asignaturas</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setFormData(initialFormData); setEditingId(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Profesor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Profesor' : 'Nuevo Profesor'}</DialogTitle>
                <DialogDescription>
                  Complete la información del profesor
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                    <Label htmlFor="asignaturaId">Asignatura que Imparte *</Label>
                    <Select value={formData.asignaturaId} onValueChange={(value) => setFormData({ ...formData, asignaturaId: value })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar asignatura" />
                      </SelectTrigger>
                      <SelectContent>
                        {asignaturas.map((asig) => (
                          <SelectItem key={asig.id} value={asig.id.toString()}>
                            {asig.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
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
                  
                  {/* Checkboxes */}
                  <div className="space-y-4 col-span-2 border-t pt-4">
                    <h4 className="font-medium text-sm">Documentación</h4>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="tomaHuellaBiometricaProf"
                          checked={formData.tomaHuellaBiometrica}
                          onCheckedChange={(checked) => setFormData({ ...formData, tomaHuellaBiometrica: checked as boolean })}
                        />
                        <Label htmlFor="tomaHuellaBiometricaProf" className="font-normal">Huella Biométrica</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="entregaFotoProf"
                          checked={formData.entregaFoto}
                          onCheckedChange={(checked) => setFormData({ ...formData, entregaFoto: checked as boolean })}
                        />
                        <Label htmlFor="entregaFotoProf" className="font-normal">Entrega de Foto</Label>
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
              placeholder="Buscar por nombre o CI..."
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
              fetchData(!showDeleted)
            }}
          >
            <Users className="h-4 w-4 mr-2" />
            {showDeleted ? 'Ver Activos' : 'Ver Eliminados'}
          </Button>
        </div>

        {showDeleted && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              <strong>Papelera:</strong> Aquí puede ver y restaurar los profesores eliminados.
            </p>
          </div>
        )}
        
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No.</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>CI</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Asignatura</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfesores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {showDeleted ? 'No hay profesores eliminados' : 'No hay profesores registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfesores.map((profesor) => (
                  <TableRow key={profesor.id} className={showDeleted ? 'bg-red-50' : ''}>
                    <TableCell>{profesor.id}</TableCell>
                    <TableCell>{profesor.nombre}</TableCell>
                    <TableCell>{profesor.ci}</TableCell>
                    <TableCell>{profesor.genero === 'M' ? 'Masculino' : profesor.genero === 'F' ? 'Femenino' : '-'}</TableCell>
                    <TableCell>{profesor.asignatura?.nombre || '-'}</TableCell>
                    <TableCell>{profesor.telefono || '-'}</TableCell>
                    <TableCell>
                      {showDeleted ? (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" title="Restaurar" onClick={() => handleRestore(profesor.id)}>
                            <RotateCcw className="h-4 w-4 text-green-500" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(profesor)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(profesor.id)}>
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
  )
}
