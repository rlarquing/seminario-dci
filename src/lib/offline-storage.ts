// Almacenamiento local offline usando IndexedDB
const DB_NAME = 'SeminarioDCI';
const DB_VERSION = 1;

// Nombres de stores
export const STORES = {
  ALUMNOS: 'alumnos',
  PROFESORES: 'profesores',
  ASIGNATURAS: 'asignaturas',
  NOTAS: 'notas',
  SYNC_QUEUE: 'syncQueue',
  METADATA: 'metadata',
} as const;

let dbInstance: IDBDatabase | null = null;

// Abrir/conectar a la base de datos
function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORES.ALUMNOS)) {
        db.createObjectStore(STORES.ALUMNOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PROFESORES)) {
        db.createObjectStore(STORES.PROFESORES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.ASIGNATURAS)) {
        db.createObjectStore(STORES.ASIGNATURAS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.NOTAS)) {
        db.createObjectStore(STORES.NOTAS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    };
  });
}

// Guardar un item
export async function saveItem(storeName: string, data: Record<string, unknown>): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Guardar múltiples items
export async function saveItems(storeName: string, items: Record<string, unknown>[]): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    for (const item of items) {
      store.put(item);
    }
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Guardar datos (compatibilidad)
export async function saveData(storeName: string, data: unknown): Promise<void> {
  if (Array.isArray(data)) {
    return saveItems(storeName, data as Record<string, unknown>[]);
  }
  return saveItem(storeName, data as Record<string, unknown>);
}

// Obtener todos los datos de un store
export async function getAllData<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

// Obtener un item por ID
export async function getDataById<T>(storeName: string, id: number): Promise<T | undefined> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

// Eliminar un item
export async function deleteData(storeName: string, id: number): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Limpiar un store completo
export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Agregar a la cola de sincronización
export async function addToSyncQueue(item: {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: Record<string, unknown>;
  endpoint: string;
  method: string;
}): Promise<void> {
  const syncItem = {
    ...item,
    timestamp: Date.now(),
    synced: false,
  };
  
  await saveItem(STORES.SYNC_QUEUE, syncItem as unknown as Record<string, unknown>);
}

// Obtener cola de sincronización
export async function getSyncQueue(): Promise<Array<{
  id: number;
  type: string;
  entity: string;
  data: Record<string, unknown>;
  endpoint: string;
  method: string;
  timestamp: number;
  synced: boolean;
}>> {
  return getAllData(STORES.SYNC_QUEUE);
}

// Eliminar item de la cola de sincronización
export async function removeSyncQueueItem(id: number): Promise<void> {
  await deleteData(STORES.SYNC_QUEUE, id);
}

// Limpiar cola de sincronización
export async function clearSyncQueue(): Promise<void> {
  await clearStore(STORES.SYNC_QUEUE);
}

// Contar items pendientes
export async function getPendingCount(): Promise<number> {
  const queue = await getSyncQueue();
  return queue.length;
}

// Verificar si hay datos pendientes de sincronizar
export async function hasPendingSync(): Promise<boolean> {
  const count = await getPendingCount();
  return count > 0;
}
