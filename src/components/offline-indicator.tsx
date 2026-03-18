'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  RefreshCw, 
  Download,
  Wifi,
  WifiOff,
  X,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'

export function OfflineIndicator() {
  // Inicializar estados con los valores correctos desde el inicio
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showManualInstall, setShowManualInstall] = useState(false)

  // Verificar si ya está instalada
  useEffect(() => {
    const checkInstalled = () => {
      // Verificar si está en modo standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      // Verificar si es iOS standalone
      const isIOSStandalone = ('standalone' in window.navigator) && 
        (window.navigator as Navigator & { standalone: boolean }).standalone
      
      if (isStandalone || isIOSStandalone) {
        setIsInstalled(true)
        return true
      }
      return false
    }

    if (checkInstalled()) return

    // Detectar iOS para mostrar instrucciones manuales
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isFirefox = navigator.userAgent.includes('Firefox')
    
    // Escuchar el evento beforeinstallprompt (Chrome, Edge, Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }

    // Escuchar cuando se instala
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
      toast.success('¡Aplicación instalada correctamente!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Para iOS/Firefox, mostrar banner manual después de un tiempo
    // (no soportan beforeinstallprompt)
    const timeoutId = setTimeout(() => {
      if (!deferredPrompt && !isInstalled && (isIOS || isFirefox)) {
        setShowInstallBanner(true)
        setShowManualInstall(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(timeoutId)
    }
  }, [deferredPrompt, isInstalled])

  // Verificar estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Conexión restaurada')
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Sin conexión - Modo offline activado')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Instalar PWA
  const handleInstall = useCallback(async () => {
    // Si hay deferredPrompt, usarlo (Chrome, Edge, Android)
    if (deferredPrompt) {
      try {
        const promptEvent = deferredPrompt as BeforeInstallPromptEvent
        promptEvent.prompt()
        
        const { outcome } = await promptEvent.userChoice
        
        if (outcome === 'accepted') {
          setIsInstalled(true)
          setShowInstallBanner(false)
          toast.success('¡Instalación iniciada!')
        }
        
        setDeferredPrompt(null)
      } catch {
        toast.error('No se pudo instalar. Intenta desde el menú del navegador.')
      }
    } else {
      // Mostrar instrucciones manuales
      setShowManualInstall(true)
    }
  }, [deferredPrompt])

  // Sincronizar datos
  const handleSync = async () => {
    if (!isOnline || isSyncing) return
    
    setIsSyncing(true)
    
    // Aquí iría la lógica de sincronización real
    setTimeout(() => {
      setIsSyncing(false)
      setPendingCount(0)
      toast.success('Datos sincronizados correctamente')
    }, 2000)
  }

  // Detectar tipo de dispositivo
  const getInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    const isFirefox = navigator.userAgent.includes('Firefox')
    
    if (isIOS) {
      return {
        title: 'Instalar en iOS',
        steps: [
          'Toca el botón "Compartir" ',
          'Desplázate y selecciona "Añadir a pantalla de inicio"',
          'Toca "Añadir" en la esquina superior derecha'
        ]
      }
    }
    
    if (isAndroid && isFirefox) {
      return {
        title: 'Instalar en Firefox Android',
        steps: [
          'Toca el menú (tres puntos) ',
          'Selecciona "Instalar"',
          'Confirma la instalación'
        ]
      }
    }
    
    if (isFirefox) {
      return {
        title: 'Instalar en Firefox',
        steps: [
          'Ve al menú ',
          'Selecciona "Instalar esta página como aplicación"'
        ]
      }
    }
    
    return {
      title: 'Instalar Aplicación',
      steps: [
        'Ve al menú del navegador (tres puntos)',
        'Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio"'
      ]
    }
  }

  // No mostrar nada si está instalada y no hay pendientes
  if (isInstalled && pendingCount === 0 && isOnline) {
    return null
  }

  const instructions = getInstallInstructions()

  return (
    <>
      {/* Banner de instalación */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <Download className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{instructions.title}</h3>
              
              {!showManualInstall && deferredPrompt ? (
                <>
                  <p className="text-xs text-gray-500 mt-1">
                    Instala Seminario DCI en tu dispositivo para acceso rápido y uso sin conexión.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handleInstall} className="bg-red-600 hover:bg-red-700">
                      <Smartphone className="h-4 w-4 mr-1" />
                      Instalar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowInstallBanner(false)}>
                      Ahora no
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    {instructions.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="bg-red-100 text-red-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shrink-0">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="mt-2" 
                    onClick={() => setShowInstallBanner(false)}
                  >
                    Cerrar
                  </Button>
                </>
              )}
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 shrink-0" 
              onClick={() => setShowInstallBanner(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Indicador de estado (esquina inferior izquierda) */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
        {/* Estado de conexión */}
        <div className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm
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
        
        {/* Botón de sincronización cuando hay pendientes */}
        {pendingCount > 0 && isOnline && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-7 text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 shadow-sm"
          >
            {isSyncing ? (
              <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
            )}
            Sincronizar ({pendingCount})
          </Button>
        )}
        
        {/* Indicador cuando hay pendientes en offline */}
        {pendingCount > 0 && !isOnline && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 shadow-sm">
            {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  )
}

// Tipo para el evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
