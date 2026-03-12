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
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'

interface Asignatura {
  id: number
  nombre: string
  codigo: string | null
}

const initialFormData = {
  nombre: '',
  codigo: '',
}

export function AsignaturasTab() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    fetchAsignaturas()
  }, [])

  const fetchAsignaturas = async () => {
    try {
      const response = await fetch('/api/asignaturas')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        setAsignaturas(data)
      } else {
        setAsignaturas([])
        if (data.error) {
          toast.error(data.error)
        }
      }
    } catch (error) {
      setAsignaturas([])
      toast.error('Error al cargar las asignaturas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        await fetch(`/api/asignaturas/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        toast.success('Asignatura actualizada correctamente')
      } else {
        await fetch('/api/asignaturas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        toast.success('Asignatura creada correctamente')
      }
      
      setIsDialogOpen(false)
      setFormData(initialFormData)
      setEditingId(null)
      fetchAsignaturas()
    } catch (error) {
      toast.error('Error al guardar la asignatura')
    }
  }

  const handleEdit = (asignatura: Asignatura) => {
    setFormData({
      nombre: asignatura.nombre,
      codigo: asignatura.codigo || '',
    })
    setEditingId(asignatura.id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta asignatura?')) return
    
    try {
      await fetch(`/api/asignaturas/${id}`, { method: 'DELETE' })
      toast.success('Asignatura eliminada correctamente')
      fetchAsignaturas()
    } catch (error) {
      toast.error('Error al eliminar la asignatura')
    }
  }

  const filteredAsignaturas = asignaturas.filter(asignatura =>
    asignatura.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Gestión de Asignaturas</CardTitle>
            <CardDescription>Administre las asignaturas del seminario</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setFormData(initialFormData); setEditingId(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Asignatura
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Asignatura' : 'Nueva Asignatura'}</DialogTitle>
                <DialogDescription>
                  Complete la información de la asignatura
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre de la Asignatura *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="Ej: ASI-001"
                      required
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
              placeholder="Buscar asignatura..."
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
                <TableHead>Código</TableHead>
                <TableHead>Nombre de la Asignatura</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAsignaturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No hay asignaturas registradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredAsignaturas.map((asignatura) => (
                  <TableRow key={asignatura.id}>
                    <TableCell>{asignatura.id}</TableCell>
                    <TableCell>{asignatura.codigo || '-'}</TableCell>
                    <TableCell>{asignatura.nombre}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(asignatura)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(asignatura.id)}>
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
