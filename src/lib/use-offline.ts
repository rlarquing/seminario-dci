'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  saveData, 
  getAllData, 
  addToSyncQueue, 
  getSyncQueue, 
  removeSyncQueueItem,
  getPendingCount,
  STORES 
} from './offline-storage'

interface UseOfflineOptions {
  apiEndpoint: string
  storeName: string
}

export function useOffline<T>({ apiEndpoint, storeName }: UseOfflineOptions) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // Verificar estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Verificar items pendientes
  useEffect(() => {
    const checkPending = async () => {
      const count = await getPendingCount()
      setPendingCount(count)
    }
    
    checkPending()
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkPending, 30000)
    return () => clearInterval(interval)
  }, [])

  // Obtener datos (del servidor si hay conexión, del cache si no)
  const fetchData = useCallback(async (): Promise<T[]> => {
    if (isOnline) {
      try {
        const response = await fetch(apiEndpoint)
        const data = await response.json()
        
        if (response.ok && Array.isArray(data)) {
          // Guardar en cache local
          await saveData(storeName, data)
          return data
        }
        return []
      } catch {
        // Si falla, intentar obtener del cache
        return getAllData<T>(storeName)
      }
    } else {
      // Sin conexión, obtener del cache
      return getAllData<T>(storeName)
    }
  }, [isOnline, apiEndpoint, storeName])

  // Crear/Actualizar datos
  const saveRecord = useCallback(async (
    data: Record<string, unknown>,
    id?: number
  ): Promise<{ success: boolean; offline?: boolean; data?: T }> => {
    const endpoint = id ? `${apiEndpoint}/${id}` : apiEndpoint
    const method = id ? 'PUT' : 'POST'
    
    if (isOnline) {
      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        
        const result = await response.json()
        
        if (response.ok) {
          // Guardar en cache local
          await saveData(storeName, result)
          return { success: true, data: result }
        }
        
        return { success: false }
      } catch {
        // Si falla, guardar offline
      }
    }
    
    // Sin conexión o error - guardar offline
    const tempId = Date.now() * -1 // ID temporal negativo
    const offlineData = { ...data, id: tempId, _offline: true }
    
    // Guardar en cache local
    await saveData(storeName, offlineData)
    
    // Agregar a cola de sincronización
    await addToSyncQueue({
      type: id ? 'UPDATE' : 'CREATE',
      entity: storeName,
      data,
      endpoint,
      method,
    })
    
    setPendingCount(prev => prev + 1)
    
    return { success: true, offline: true, data: offlineData as T }
  }, [isOnline, apiEndpoint, storeName])

  // Eliminar datos
  const deleteRecord = useCallback(async (id: number): Promise<{ success: boolean; offline?: boolean }> => {
    if (isOnline) {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, { method: 'DELETE' })
        
        if (response.ok) {
          return { success: true }
        }
        
        return { success: false }
      } catch {
        // Si falla, guardar para sincronizar después
      }
    }
    
    // Sin conexión - agregar a cola
    await addToSyncQueue({
      type: 'DELETE',
      entity: storeName,
      data: { id },
      endpoint: `${apiEndpoint}/${id}`,
      method: 'DELETE',
    })
    
    setPendingCount(prev => prev + 1)
    
    return { success: true, offline: true }
  }, [isOnline, apiEndpoint, storeName])

  // Sincronizar datos pendientes
  const syncData = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (!isOnline || isSyncing) {
      return { synced: 0, failed: 0 }
    }
    
    setIsSyncing(true)
    let synced = 0
    let failed = 0
    
    try {
      const queue = await getSyncQueue()
      
      for (const item of queue) {
        try {
          const response = await fetch(item.endpoint, {
            method: item.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
          
          if (response.ok) {
            await removeSyncQueueItem(item.id)
            synced++
          } else {
            failed++
          }
        } catch {
          failed++
        }
      }
      
      setPendingCount(prev => Math.max(0, prev - synced))
      setLastSync(new Date())
    } finally {
      setIsSyncing(false)
    }
    
    return { synced, failed }
  }, [isOnline, isSyncing])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSync,
    fetchData,
    saveRecord,
    deleteRecord,
    syncData,
    hasPending: pendingCount > 0,
  }
}

// Hook simple para estado de conexión
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Hook para detectar si es PWA instalada
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  )
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

  useEffect(() => {
    // Escuchar evento de instalación
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setCanInstall(true)
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Escuchar cuando se instala
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
    }
    
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return false

    // Mostrar prompt de instalación
    (deferredPrompt as BeforeInstallPromptEvent).prompt()
    
    const result = await (deferredPrompt as BeforeInstallPromptEvent).userChoice
    
    if (result.outcome === 'accepted') {
      setIsInstalled(true)
      return true
    }
    
    return false
  }

  return {
    isInstalled,
    canInstall,
    installApp,
  }
}

// Tipo para el evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
