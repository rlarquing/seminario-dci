import { PrismaClient } from '@prisma/client'
import path from 'path'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.resolve('./prisma/custom.db').replace(/\\/g, '/')}`,
    },
  },
})

const ASIGNATURAS = [
  { nombre: 'Hermenéutica', codigo: 'HER-101' },
  { nombre: 'Homilética', codigo: 'HOM-101' },
  { nombre: 'Eclesiología', codigo: 'ECL-101' },
  { nombre: 'Evangelismo', codigo: 'EVA-101' },
  { nombre: 'Vida Cristiana', codigo: 'VCR-101' },
  { nombre: 'Historia de la Iglesia', codigo: 'HCI-101' },
  { nombre: 'Escatología', codigo: 'ESC-101' },
  { nombre: 'Doctrinas Bíblicas', codigo: 'DBI-101' },
]

async function main() {
  console.log('Inicializando base de datos...')

  // Verificar si ya hay asignaturas
  const existingCount = await prisma.asignatura.count()
  
  if (existingCount > 0) {
    console.log(`Ya existen ${existingCount} asignaturas. No se insertaron datos.`)
    return
  }

  // Insertar asignaturas
  for (const asig of ASIGNATURAS) {
    await prisma.asignatura.create({
      data: asig,
    })
    console.log(`✓ Creado: ${asig.nombre} (${asig.codigo})`)
  }

  console.log('\n✓ Base de datos inicializada correctamente')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
