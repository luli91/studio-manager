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
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <UserIcon className="h-8 w-8 text-primary" />
            Directorio de Alumnas
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Tenés {alumnas.length} alumnas registradas en el estudio.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nombre o email..." 
          className="pl-12 h-14 bg-card border-border rounded-2xl shadow-sm text-base font-medium focus-visible:ring-ring"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card">
        <CardContent className="p-0">
          {alumnasFiltradas.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-medium bg-muted/30">
              No se encontraron alumnas con ese nombre.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alumnasFiltradas.map((alumna) => (
                <div 
                  key={alumna.id} 
                  onClick={() => setAlumnaSeleccionada(alumna)}
                  className="flex items-center justify-between p-4 sm:px-6 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-black text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                      {alumna.nombre_completo?.charAt(0) || "A"}
                    </div>
                    
                    <div>
                      <p className="font-bold text-foreground text-base leading-tight">
                        {alumna.nombre_completo || "Sin nombre"}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate max-w-[150px] sm:max-w-xs">
                        {alumna.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-black ${alumna.creditos_clases > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {alumna.creditos_clases || 0}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Clases</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
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