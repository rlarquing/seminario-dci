'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'

interface Profesor {
  id: number
  nombre: string
  apellidos: string
  ci: string
  asignaturaId: number | null
  telefono: string | null
  email: string | null
  asignatura?: { id: number; nombre: string } | null
}

interface Asignatura {
  id: number
  nombre: string
  codigo: string | null
}

const initialFormData = {
  nombre: '',
  apellidos: '',
  ci: '',
  asignaturaId: '',
  telefono: '',
  email: '',
}

export function ProfesoresTab() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [profRes, asigRes] = await Promise.all([
        fetch('/api/profesores'),
        fetch('/api/asignaturas')
      ])
      const profData = await profRes.json()
      const asigData = await asigRes.json()
      setProfesores(profData)
      setAsignaturas(asigData)
    } catch (error) {
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
      fetchData()
    } catch (error) {
      toast.error('Error al guardar el profesor')
    }
  }

  const handleEdit = (profesor: Profesor) => {
    setFormData({
      nombre: profesor.nombre,
      apellidos: profesor.apellidos,
      ci: profesor.ci,
      asignaturaId: profesor.asignaturaId?.toString() || '',
      telefono: profesor.telefono || '',
      email: profesor.email || '',
    })
    setEditingId(profesor.id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este profesor?')) return
    
    try {
      await fetch(`/api/profesores/${id}`, { method: 'DELETE' })
      toast.success('Profesor eliminado correctamente')
      fetchData()
    } catch (error) {
      toast.error('Error al eliminar el profesor')
    }
  }

  const filteredProfesores = profesores.filter(profesor =>
    `${profesor.nombre} ${profesor.apellidos} ${profesor.ci}`.toLowerCase().includes(searchTerm.toLowerCase())
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Profesor' : 'Nuevo Profesor'}</DialogTitle>
                <DialogDescription>
                  Complete la información del profesor
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 py-4">
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
                    <Label htmlFor="asignaturaId">Asignatura que Imparte</Label>
                    <Select value={formData.asignaturaId} onValueChange={(value) => setFormData({ ...formData, asignaturaId: value })}>
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
                <TableHead>Asignatura</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfesores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No hay profesores registrados
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfesores.map((profesor) => (
                  <TableRow key={profesor.id}>
                    <TableCell>{profesor.id}</TableCell>
                    <TableCell>{profesor.nombre} {profesor.apellidos}</TableCell>
                    <TableCell>{profesor.ci}</TableCell>
                    <TableCell>{profesor.asignatura?.nombre || '-'}</TableCell>
                    <TableCell>{profesor.telefono || '-'}</TableCell>
                    <TableCell>{profesor.email || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(profesor)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(profesor.id)}>
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
