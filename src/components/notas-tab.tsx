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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, Search, Calculator } from 'lucide-react'
import { toast } from 'sonner'

interface Alumno {
  id: number
  nombre: string
  apellidos: string
  ci: string
  notas: { asignaturaId: number; nota: number | null }[]
}

interface Asignatura {
  id: number
  nombre: string
  codigo: string | null
}

interface NotaData {
  asignaturaId: number
  nombre: string
  nota: number | null
}

export function NotasTab() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlumno, setSelectedAlumno] = useState<string>('')
  const [notas, setNotas] = useState<NotaData[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [alumRes, asigRes] = await Promise.all([
        fetch('/api/alumnos'),
        fetch('/api/asignaturas')
      ])
      const alumData = await alumRes.json()
      const asigData = await asigRes.json()
      setAlumnos(alumData)
      setAsignaturas(asigData)
    } catch (error) {
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedAlumno) {
      loadNotas(selectedAlumno)
    }
  }, [selectedAlumno])

  const loadNotas = async (alumnoId: string) => {
    try {
      const response = await fetch(`/api/notas?alumnoId=${alumnoId}`)
      const data = await response.json()
      
      // Crear array con todas las asignaturas y sus notas
      const notasData: NotaData[] = asignaturas.map(asig => {
        const existingNota = data.find((n: { asignaturaId: number; nota: number | null }) => n.asignaturaId === asig.id)
        return {
          asignaturaId: asig.id,
          nombre: asig.nombre,
          nota: existingNota?.nota || null
        }
      })
      
      setNotas(notasData)
    } catch (error) {
      toast.error('Error al cargar las notas')
    }
  }

  const handleNotaChange = (asignaturaId: number, value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    setNotas(prev => prev.map(n => 
      n.asignaturaId === asignaturaId ? { ...n, nota: numValue } : n
    ))
  }

  const handleSaveNota = async (asignaturaId: number, nota: number | null) => {
    if (!selectedAlumno) return
    
    try {
      await fetch('/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumnoId: parseInt(selectedAlumno),
          asignaturaId,
          nota
        })
      })
      toast.success('Nota guardada correctamente')
    } catch (error) {
      toast.error('Error al guardar la nota')
    }
  }

  const handleSaveAllNotas = async () => {
    if (!selectedAlumno) return
    
    try {
      const promises = notas.map(n => 
        fetch('/api/notas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alumnoId: parseInt(selectedAlumno),
            asignaturaId: n.asignaturaId,
            nota: n.nota
          })
        })
      )
      
      await Promise.all(promises)
      toast.success('Todas las notas guardadas correctamente')
    } catch (error) {
      toast.error('Error al guardar las notas')
    }
  }

  const calcularPromedio = () => {
    const notasValidas = notas.filter(n => n.nota !== null)
    if (notasValidas.length === 0) return null
    const sum = notasValidas.reduce((acc, n) => acc + (n.nota || 0), 0)
    return (sum / notasValidas.length).toFixed(2)
  }

  const filteredAlumnos = alumnos.filter(alumno =>
    `${alumno.nombre} ${alumno.apellidos} ${alumno.ci}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedAlumnoData = alumnos.find(a => a.id.toString() === selectedAlumno)

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Notas</CardTitle>
        <CardDescription>Seleccione un alumno para gestionar sus calificaciones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selector de Alumno */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Buscar Alumno</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nombre o CI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="border rounded-md max-h-96 overflow-y-auto">
                {filteredAlumnos.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No hay alumnos</div>
                ) : (
                  filteredAlumnos.map(alumno => (
                    <div
                      key={alumno.id}
                      onClick={() => setSelectedAlumno(alumno.id.toString())}
                      className={`p-3 cursor-pointer border-b last:border-b-0 hover:bg-gray-50 ${
                        selectedAlumno === alumno.id.toString() ? 'bg-red-50 border-l-4 border-l-red-600' : ''
                      }`}
                    >
                      <div className="font-medium">{alumno.nombre} {alumno.apellidos}</div>
                      <div className="text-sm text-gray-500">CI: {alumno.ci}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tabla de Notas */}
          <div className="lg:col-span-2">
            {selectedAlumno ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg">
                    {selectedAlumnoData?.nombre} {selectedAlumnoData?.apellidos}
                  </h3>
                  <p className="text-sm text-gray-600">CI: {selectedAlumnoData?.ci}</p>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No.</TableHead>
                        <TableHead>Asignatura</TableHead>
                        <TableHead className="w-32">Nota</TableHead>
                        <TableHead className="w-20">Guardar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notas.map((nota, index) => (
                        <TableRow key={nota.asignaturaId}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{nota.nombre}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={nota.nota ?? ''}
                              onChange={(e) => handleNotaChange(nota.asignaturaId, e.target.value)}
                              placeholder="0-100"
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveNota(nota.asignaturaId, nota.nota)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Fila de Promedio */}
                      <TableRow className="bg-gray-100 font-semibold">
                        <TableCell colSpan={2}>
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Promedio General
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-lg">
                            {calcularPromedio() ?? '-'}
                          </span>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Button onClick={handleSaveAllNotas} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Todas las Notas
                </Button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 border rounded-md p-10">
                Seleccione un alumno para ver y editar sus notas
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
