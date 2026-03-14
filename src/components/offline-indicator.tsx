'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  RefreshCw, 
  Download,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useOnlineStatus, usePWA } from '@/lib/use-offline'
import { getPendingCount } from '@/lib/offline-storage'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const { canInstall, installApp, isInstalled } = usePWA()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  
  useEffect(() => {
    const checkPending = async () => {
      const count = await getPendingCount()
      setPendingCount(count)
    }
    
    checkPending()
    
    // Verificar periódicamente
    const interval = setInterval(checkPending, 10000)
    return () => clearInterval(interval)
  }, [])
  
  // Mostrar banner de instalación después de 3 segundos
  useEffect(() => {
    if (canInstall && !isInstalled) {
      const timer = setTimeout(() => setShowInstallBanner(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled])
  
  const handleSync = async () => {
    if (!isOnline || isSyncing) return
    
    setIsSyncing(true)
    
    // Simular sincronización
    // En producción, esto llamaría a la API
    setTimeout(() => {
      setIsSyncing(false)
      setPendingCount(0)
    }, 2000)
  }
  
  return (
    <>
      {/* Banner de instalación */}
      {showInstallBanner && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Download className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Instalar Aplicación</h3>
              <p className="text-xs text-gray-500 mt-1">
                Instala Seminario DCI en tu dispositivo para acceso rápido y uso offline.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={installApp} className="bg-red-600 hover:bg-red-700">
                  Instalar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowInstallBanner(false)}>
                  Ahora no
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Indicador de estado */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
        {/* Estado de conexión */}
        <div className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
          ${isOnline 
            ? 'bg-green-100 text-green-700' 
            : 'bg-orange-100 text-orange-700'
          }
        `}>
          {isOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              Offline
            </>
          )}
        </div>
        
        {/* Indicador de pendientes */}
        {pendingCount > 0 && isOnline && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-7 text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          >
            {isSyncing ? (
              <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
            )}
            Sincronizar ({pendingCount})
          </Button>
        )}
        
        {/* Indicador de datos guardados offline */}
        {pendingCount > 0 && !isOnline && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  )
}
