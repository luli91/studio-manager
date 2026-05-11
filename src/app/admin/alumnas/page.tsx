"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Loader2, Search, User as UserIcon, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <UserIcon className="h-8 w-8 text-fuchsia-600" />
            Directorio de Alumnas
          </h1>
          <p className="text-slate-500 font-medium mt-1">Tenés {alumnas.length} alumnas registradas en el estudio.</p>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Buscar por nombre o email..." 
          className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm text-base font-medium focus-visible:ring-fuchsia-500"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {/* LISTA DE ALUMNAS (ESTILO WHATSAPP/GMAIL) */}
      <Card className="border-slate-200 shadow-sm rounded-[2rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          {alumnasFiltradas.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-medium bg-slate-50">
              No se encontraron alumnas con ese nombre.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alumnasFiltradas.map((alumna) => (
                <div 
                  key={alumna.id} 
                  onClick={() => setAlumnaSeleccionada(alumna)}
                  className="flex items-center justify-between p-4 sm:px-6 hover:bg-fuchsia-50/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    {/* BURBUJA DE INICIAL MINIMALISTA */}
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xl group-hover:bg-fuchsia-100 group-hover:text-fuchsia-600 transition-colors shrink-0">
                      {alumna.nombre_completo?.charAt(0) || "A"}
                    </div>
                    
                    {/* DATOS DE LA ALUMNA */}
                    <div>
                      <p className="font-bold text-slate-900 text-base leading-tight group-hover:text-fuchsia-700 transition-colors">
                        {alumna.nombre_completo || "Sin nombre"}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate max-w-[150px] sm:max-w-xs">
                        {alumna.email}
                      </p>
                    </div>
                  </div>
                  
                  {/* ESTADO DE CLASES Y FLECHA */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-black ${alumna.creditos_clases > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {alumna.creditos_clases || 0}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Clases</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-fuchsia-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL FICHA DE ALUMNA */}
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