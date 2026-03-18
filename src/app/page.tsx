'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GraduationCap, Users, BookOpen, ClipboardList, FileText, FileBarChart, Settings } from 'lucide-react'
import { AlumnosTab } from '@/components/alumnos-tab'
import { ProfesoresTab } from '@/components/profesores-tab'
import { AsignaturasTab } from '@/components/asignaturas-tab'
import { NotasTab } from '@/components/notas-tab'
import { CertificadosTab } from '@/components/certificados-tab'
import { ReportesTab } from '@/components/reportes-tab'
import { BackupTab } from '@/components/backup-tab'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Image 
              src="/images/logo.png" 
              alt="Logo DCI" 
              width={60} 
              height={60}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold">Seminario DCI</h1>
              <p className="text-red-100 text-sm">Sistema de Gestión Académica</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs defaultValue="alumnos" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6 bg-white shadow-sm">
            <TabsTrigger value="alumnos" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Alumnos</span>
            </TabsTrigger>
            <TabsTrigger value="profesores" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Profesores</span>
            </TabsTrigger>
            <TabsTrigger value="asignaturas" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Asignaturas</span>
            </TabsTrigger>
            <TabsTrigger value="notas" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Notas</span>
            </TabsTrigger>
            <TabsTrigger value="certificados" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Certificados</span>
            </TabsTrigger>
            <TabsTrigger value="reportes" className="flex items-center gap-2">
              <FileBarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="configuracion" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alumnos">
            <AlumnosTab />
          </TabsContent>

          <TabsContent value="profesores">
            <ProfesoresTab />
          </TabsContent>

          <TabsContent value="asignaturas">
            <AsignaturasTab />
          </TabsContent>

          <TabsContent value="notas">
            <NotasTab />
          </TabsContent>

          <TabsContent value="certificados">
            <CertificadosTab />
          </TabsContent>

          <TabsContent value="reportes">
            <ReportesTab />
          </TabsContent>

          <TabsContent value="configuracion">
            <BackupTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © 2026 Seminario DCI - Sistema de Gestión Académica
          </p>
        </div>
      </footer>
    </div>
  )
}
