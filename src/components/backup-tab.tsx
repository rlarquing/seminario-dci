'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  HardDrive,
  Clock,
  FileJson
} from 'lucide-react'
import { toast } from 'sonner'

interface BackupData {
  version: string
  fecha: string
  app: string
  datos: {
    alumnos: unknown[]
    profesores: unknown[]
    asignaturas: unknown[]
    notas: unknown[]
  }
  estadisticas: {
    totalAlumnos: number
    totalProfesores: number
    totalAsignaturas: number
    totalNotas: number
  }
}

export function BackupTab() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Exportar backup
  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const response = await fetch('/api/backup')
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al exportar')
      }
      
      const data: BackupData = await response.json()
      
      // Crear archivo JSON para descargar
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-seminario-dci-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setLastBackup(new Date().toLocaleString('es-ES'))
      toast.success('Backup descargado correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al exportar backup')
    } finally {
      setIsExporting(false)
    }
  }

  // Importar backup
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Confirmar antes de restaurar
    const confirmMessage = '⚠️ ADVERTENCIA: Al restaurar un backup, todos los datos actuales serán ELIMINADOS y reemplazados por los datos del archivo.\n\n¿Está seguro de que desea continuar?'
    if (!confirm(confirmMessage)) {
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }
    
    setIsImporting(true)
    
    try {
      // Leer archivo
      const text = await file.text()
      const data: BackupData = JSON.parse(text)
      
      // Validar estructura básica
      if (!data.version || !data.datos || !data.app) {
        throw new Error('El archivo no parece ser un backup válido de Seminario DCI')
      }
      
      // Validar que sea de nuestra app
      if (data.app !== 'Seminario DCI') {
        throw new Error('El archivo de backup no corresponde a Seminario DCI')
      }
      
      // Enviar al servidor
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al restaurar backup')
      }
      
      toast.success(`Backup restaurado: ${result.resultado.alumnos} alumnos, ${result.resultado.profesores} profesores, ${result.resultado.asignaturas} asignaturas, ${result.resultado.notas} notas`)
      
      // Recargar la página para ver los cambios
      setTimeout(() => {
        window.location.reload()
      }, 1500)
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al importar backup')
    } finally {
      setIsImporting(false)
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Alerta informativa */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">¿Por qué hacer backup?</AlertTitle>
        <AlertDescription className="text-blue-700">
          Mantener copias de seguridad de sus datos es una buena práctica. 
          Le permite recuperar su información en caso de cualquier eventualidad y tener un respaldo seguro en su computadora.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar Backup */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Exportar Backup</CardTitle>
                <CardDescription>Descarga todos los datos en un archivo JSON</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">El archivo incluirá:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Todos los alumnos registrados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Todos los profesores
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Todas las asignaturas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Todas las calificaciones (notas)
                </li>
              </ul>
            </div>
            
            {lastBackup && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Último backup: {lastBackup}
              </div>
            )}
            
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Importar Backup */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Upload className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>Restaurar Backup</CardTitle>
                <CardDescription>Carga un archivo de backup previamente exportado</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">¡Importante!</AlertTitle>
              <AlertDescription className="text-red-700">
                Al restaurar un backup, <strong>todos los datos actuales serán eliminados</strong> y reemplazados por los del archivo.
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Formato aceptado:
              </h4>
              <p className="text-sm text-gray-600">
                Archivos JSON generados por esta aplicación (backup-seminario-dci-*.json)
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="backup-file"
            />
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {isImporting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
                  Restaurando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Archivo de Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HardDrive className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Recomendaciones</CardTitle>
              <CardDescription>Mejores prácticas para sus copias de seguridad</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">📅 Frecuencia</h4>
              <p className="text-sm text-gray-600">
                Haga backup al menos una vez por semana, o después de registrar datos importantes.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">💾 Almacenamiento</h4>
              <p className="text-sm text-gray-600">
                Guarde los backups en diferentes ubicaciones: USB, Google Drive, Dropbox, etc.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">🏷️ Nombres</h4>
              <p className="text-sm text-gray-600">
                Los archivos incluyen la fecha automáticamente. No los renombre para facilitar la organización.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
