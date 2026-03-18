-- CreateTable
CREATE TABLE "alumnos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroExpediente" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "ci" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "pasaporte" TEXT,
    "direccion" TEXT,
    "genero" TEXT,
    "nombreIglesia" TEXT,
    "nombrePastor" TEXT,
    "tomaHuellaBiometrica" BOOLEAN NOT NULL DEFAULT false,
    "entregaFoto" BOOLEAN NOT NULL DEFAULT false,
    "pagoCuotas" TEXT,
    "disposicionCampoMisionero" BOOLEAN NOT NULL DEFAULT false,
    "habilidades" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "profesores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "ci" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "genero" TEXT,
    "nombreIglesia" TEXT,
    "nombrePastor" TEXT,
    "tomaHuellaBiometrica" BOOLEAN NOT NULL DEFAULT false,
    "entregaFoto" BOOLEAN NOT NULL DEFAULT false,
    "asignaturaId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "profesores_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "asignaturas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asignaturas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "notas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alumnoId" INTEGER NOT NULL,
    "asignaturaId" INTEGER NOT NULL,
    "nota" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notas_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notas_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "asignaturas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "alumnos_numeroExpediente_key" ON "alumnos"("numeroExpediente");

-- CreateIndex
CREATE UNIQUE INDEX "alumnos_ci_key" ON "alumnos"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "asignaturas_codigo_key" ON "asignaturas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "notas_alumnoId_asignaturaId_key" ON "notas"("alumnoId", "asignaturaId");
