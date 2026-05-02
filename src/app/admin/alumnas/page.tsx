"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Loader2, Search, User as UserIcon, Settings } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import PerfilAlumnaModal from "@/components/admin/PerfilAlumnaModal"

export default function AdminDashboardPage() {
  const supabase = createClient()
  const [alumnas, setAlumnas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState("")
  
  const [alumnaSeleccionada, setAlumnaSeleccionada] = useState<any | null>(null)

  const cargarAlumnas = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .eq("rol", "alumna")
      .order("nombre_completo", { ascending: true })

    if (data) setAlumnas(data)
    setCargando(false)
  }

  useEffect(() => {
    cargarAlumnas()
  }, [supabase])

  const alumnasFiltradas = alumnas.filter(a => 
    a.nombre_completo?.toLowerCase().includes(filtro.toLowerCase()) || 
    a.email?.toLowerCase().includes(filtro.toLowerCase())
  )

  if (cargando) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-fuchsia-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <UserIcon className="h-8 w-8 text-fuchsia-600" />
            Directorio de Alumnas
          </h1>
          <p className="text-slate-500 mt-1">Tenés {alumnas.length} alumnas registradas en el estudio.</p>
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 rounded-t-xl">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre o email..." 
              className="pl-10 bg-white border-slate-200"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {alumnasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No se encontraron alumnas.</div>
            ) : (
              alumnasFiltradas.map((alumna) => (
                <div key={alumna.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                  
                  {/* ACÁ LIMPIAMOS: Solo mostramos el nombre */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{alumna.nombre_completo || "Sin nombre"}</h3>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clases</p>
                      <p className="text-2xl font-black text-fuchsia-600 flex items-center justify-end gap-1">
                        {alumna.creditos_clases || 0}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => setAlumnaSeleccionada(alumna)}
                      className="bg-slate-900 text-white hover:bg-fuchsia-600 shadow-sm"
                    >
                      <Settings className="h-4 w-4 mr-2" /> Ficha de Alumna
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {alumnaSeleccionada && (
        <PerfilAlumnaModal 
          alumna={alumnaSeleccionada} 
          onClose={() => setAlumnaSeleccionada(null)} 
          onUpdate={cargarAlumnas} 
        />
      )}

    </div>
  )
}