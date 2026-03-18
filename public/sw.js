// Service Worker para Seminario DCI PWA
const CACHE_NAME = 'seminario-dci-v3';
const OFFLINE_URL = '/offline.html';

// Archivos a cachear para uso offline
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/logo.png',
  '/images/qr.png',
  '/offline.html'
];

// APIs que NO deben cachearse (datos dinámicos)
const NO_CACHE_APIS = [
  '/api/alumnos',
  '/api/profesores', 
  '/api/asignaturas',
  '/api/notas',
  '/api/calificaciones'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando archivos estáticos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activado');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Para peticiones POST, PUT, DELETE, PATCH - NO cachear
  if (request.method !== 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Limpiar cache de la API correspondiente después de una operación exitosa
          if (response.ok && url.pathname.startsWith('/api/')) {
            clearApiCache(url.pathname);
          }
          return response;
        })
        .catch(async () => {
          // Guardar petición para sincronizar después
          const requestData = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: await request.text(),
            timestamp: Date.now()
          };
          
          // Guardar en IndexedDB para sincronizar después
          await saveToSyncQueue(requestData);
          
          // Responder que se guardará cuando haya conexión
          return new Response(JSON.stringify({
            success: false,
            offline: true,
            message: 'Datos guardados localmente. Se sincronizarán cuando haya conexión.'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // Para peticiones GET de API - Network First (siempre obtener datos frescos)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Actualizar cache con datos frescos
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Si no hay conexión, usar cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(JSON.stringify({ 
              error: 'offline',
              message: 'No hay conexión y no hay datos en caché' 
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }
  
  // Para archivos estáticos - Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Actualizar cache en segundo plano
        fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response);
          });
        }).catch(() => {});
        return cachedResponse;
      }
      
      return fetch(request)
        .then((response) => {
          // Guardar en cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Si es una página, mostrar página offline
          if (request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Limpiar cache de API específica
async function clearApiCache(pathname) {
  const cache = await caches.open(CACHE_NAME);
  
  // Encontrar y eliminar todas las entradas de la API correspondiente
  const keys = await cache.keys();
  for (const key of keys) {
    if (key.url.includes(pathname.split('/')[1] + '/' + pathname.split('/')[2])) {
      await cache.delete(key);
    }
  }
}

// Escuchar cuando vuelve la conexión
self.addEventListener('sync', (event) => {
  console.log('[SW] Sincronizando datos pendientes...');
  event.waitUntil(syncPendingData());
});

// Función para guardar peticiones en cola de sincronización
async function saveToSyncQueue(requestData) {
  // Usar IndexedDB para guardar
  const db = await openDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  await store.add(requestData);
  await tx.done;
  
  // Registrar para sincronización en segundo plano
  self.registration.sync.register('sync-data');
}

// Función para sincronizar datos pendientes
async function syncPendingData() {
  const db = await openDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  const pendingRequests = await store.getAll();
  
  for (const request of pendingRequests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      
      if (response.ok) {
        // Eliminar de la cola si fue exitoso
        await store.delete(request.timestamp);
        console.log('[SW] Sincronizado:', request.url);
        
        // Notificar al usuario
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              message: 'Datos sincronizados correctamente'
            });
          });
        });
      }
    } catch (error) {
      console.error('[SW] Error sincronizando:', request.url, error);
    }
  }
}

// Función para abrir IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SeminarioDCI', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store para cola de sincronización
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'timestamp' });
      }
      
      // Store para datos offline
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData', { keyPath: 'key' });
      }
    };
  });
}

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_API_CACHE') {
    event.waitUntil(clearApiCache(event.data.pathname));
  }
  
  if (event.data.type === 'GET_PENDING_COUNT') {
    getPendingCount().then((count) => {
      event.ports[0].postMessage({ count });
    });
  }
});

// Obtener cantidad de peticiones pendientes
async function getPendingCount() {
  try {
    const db = await openDB();
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const count = await store.count();
    return count;
  } catch {
    return 0;
  }
}
