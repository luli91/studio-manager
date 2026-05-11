"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Loader2, Search, UserPlus, ChevronRight, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { X } from "lucide-react"
import Link from "next/link"

export default function DirectorioProfes() {
  const supabase = createClient()
  const [profes, setProfes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState("")

  const [modalAbierto, setModalAbierto] = useState(false)
  const [alumnas, setAlumnas] = useState<any[]>([])
  const [busquedaModal, setBusquedaModal] = useState("")
  const [cargandoAlumnas, setCargandoAlumnas] = useState(false)
  const [convirtiendo, setConvirtiendo] = useState(false)

  const cargarProfes = async () => {
    setCargando(true)
    const { data } = await supabase
      .from("perfiles")
      .select("*")
      .eq("rol", "profe")
      .order("nombre_completo", { ascending: true })

    if (data) setProfes(data)
    setCargando(false)
  }

  useEffect(() => {
    cargarProfes()
  }, [])

  const abrirModal = async () => {
    setModalAbierto(true)
    setCargandoAlumnas(true)
    const { data } = await supabase
      .from("perfiles")
      .select("id, nombre_completo, email")
      .eq("rol", "alumna")
      .order("nombre_completo")
    if (data) setAlumnas(data)
    setCargandoAlumnas(false)
  }

  const convertirAProfe = async (alumnaId: string, nombre: string) => {
    const confirmacion = window.confirm(`¿Estás segura que querés darle rol de Profesora a ${nombre}? \nDesde ahora tendrá acceso a ver grillas y asignar asistencias.`)
    if (!confirmacion) return

    setConvirtiendo(true)
    try {
      const { error } = await supabase.from("perfiles").update({ rol: "profe" }).eq("id", alumnaId)
      if (error) throw error
      toast.success(`¡${nombre} fue agregada al Staff! 🎉`)
      setModalAbierto(false)
      cargarProfes() 
    } catch (error: any) {
      toast.error("Error al cambiar rol: " + error.message)
    } finally {
      setConvirtiendo(false)
    }
  }

  const profesFiltradas = profes.filter(p => 
    p.nombre_completo?.toLowerCase().includes(filtro.toLowerCase()) || 
    p.email?.toLowerCase().includes(filtro.toLowerCase())
  )

  const alumnasFiltradasParaModal = alumnas.filter(a => 
    a.nombre_completo?.toLowerCase().includes(busquedaModal.toLowerCase())
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
            Staff de Profesoras
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Gestioná el equipo de trabajo del estudio.</p>
        </div>
        
        <Button onClick={abrirModal} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg transition-colors h-12 px-6">
          <UserPlus className="h-5 w-5 mr-2" /> Agregar Profe
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Buscar profe por nombre..." 
          className="pl-12 h-14 bg-card border-border rounded-2xl shadow-sm text-base font-medium focus-visible:ring-ring"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card">
        <CardContent className="p-0">
          {profesFiltradas.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-medium bg-muted/30">
              No se encontraron profesoras.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {profesFiltradas.map((profe) => (
                <Link key={profe.id} href={`/admin/profesoras/${profe.id}`}>
                  <div className="flex items-center justify-between p-4 sm:px-6 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group">
                    
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-black text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                        {profe.nombre_completo?.charAt(0) || "P"}
                      </div>
                      
                      <div>
                        <p className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors">
                          {profe.nombre_completo || "Sin nombre"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate max-w-[150px] sm:max-w-xs flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {profe.telefono || "Sin teléfono cargado"}
                        </p>
                      </div>
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {modalAbierto && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden border-2 border-border">
            <div className="p-6 bg-primary text-primary-foreground flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-black text-xl tracking-tighter uppercase italic">Agregar Profesora</h3>
                <p className="text-primary-foreground/70 text-xs mt-1 font-medium">Buscá una alumna para darle rol de profe.</p>
              </div>
              <button onClick={() => setModalAbierto(false)} className="hover:bg-background/20 p-2 rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-background space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nombre..." 
                  className="pl-10 bg-card h-12 rounded-xl border-border font-medium text-sm"
                  value={busquedaModal}
                  onChange={(e) => setBusquedaModal(e.target.value)}
                />
              </div>

              <div className="bg-card border border-border rounded-xl shadow-sm divide-y overflow-hidden">
                {cargandoAlumnas ? (
                  <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : alumnasFiltradasParaModal.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm italic">No se encontraron alumnas.</div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {alumnasFiltradasParaModal.map(alumna => (
                      <div key={alumna.id} className="p-4 hover:bg-accent flex justify-between items-center transition-colors">
                        <div>
                          <p className="font-bold text-sm text-foreground">{alumna.nombre_completo}</p>
                          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{alumna.email}</p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => convertirAProfe(alumna.id, alumna.nombre_completo)}
                          disabled={convirtiendo}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8 px-3 rounded-lg transition-colors shadow-sm"
                        >
                          Dar de Alta
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}