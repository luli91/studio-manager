"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Loader2, Search, UserPlus, ChevronRight, Phone, UserMinus, ShieldAlert, AlertTriangle } from "lucide-react"
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
  
  const [alumnaAConvertir, setAlumnaAConvertir] = useState<{id: string, nombre: string} | null>(null)
  const [profeADegradar, setProfeADegradar] = useState<{id: string, nombre: string} | null>(null)
  const [procesando, setProcesando] = useState(false)

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

  // ACCIÓN FINAL: Convertir a profe
  const ejecutarConversion = async () => {
    if (!alumnaAConvertir) return

    setProcesando(true)
    try {
      const { error } = await supabase.from("perfiles").update({ rol: "profe" }).eq("id", alumnaAConvertir.id)
      if (error) throw error
      toast.success(`¡${alumnaAConvertir.nombre} fue agregada al Staff! 🎉`)
      setAlumnaAConvertir(null)
      setModalAbierto(false)
      cargarProfes() 
    } catch (error: any) {
      toast.error("Error al cambiar rol: " + error.message)
    } finally {
      setProcesando(false)
    }
  }

  // ACCIÓN FINAL: Degradar de profe a alumna
  const ejecutarDegradacion = async () => {
    if (!profeADegradar) return

    setProcesando(true)
    try {
      const { error } = await supabase.from("perfiles").update({ rol: "alumna" }).eq("id", profeADegradar.id)
      if (error) throw error
      toast.success(`Rol de profesora revocado a ${profeADegradar.nombre}.`)
      setProfeADegradar(null)
      cargarProfes() 
    } catch (error: any) {
      toast.error("Error al revocar rol: " + error.message)
    } finally {
      setProcesando(false)
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
                <Link key={profe.id} href={`/admin/profesoras/${profe.id}`} className="block hover:bg-accent transition-colors group">
                  <div className="flex items-center justify-between p-4 sm:px-6">
                    
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
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Quitar rol de profesora"
                        onClick={(e) => {
                          e.preventDefault(); // Evita que se abra el Link al perfil
                          setProfeADegradar({ id: profe.id, nombre: profe.nombre_completo || "esta persona" });
                        }}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                      
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- MODAL PARA BUSCAR Y AGREGAR PROFE --- */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in">
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
                  className="pl-10 bg-card h-12 rounded-xl border-border font-medium text-sm focus-visible:ring-ring"
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
                          onClick={() => setAlumnaAConvertir({ id: alumna.id, nombre: alumna.nombre_completo })}
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

      {/* --- MODAL CONFIRMACIÓN: CONVERTIR A PROFE --- */}
      {alumnaAConvertir && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center space-y-5 border border-primary">
            <div className="mx-auto w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-2 shadow-inner">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-foreground tracking-tighter">¿Hacer Profesora?</h3>
              <p className="text-muted-foreground text-sm mt-2 font-medium leading-relaxed">
                Estás por darle el rol de Staff a <strong>{alumnaAConvertir.nombre}</strong>. Tendrá acceso a ver grillas, alumnas y asignar asistencias.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={ejecutarConversion} disabled={procesando} className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-12">
                {procesando ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Confirmar y dar acceso
              </Button>
              <Button onClick={() => setAlumnaAConvertir(null)} disabled={procesando} variant="ghost" className="w-full rounded-xl font-bold text-muted-foreground hover:bg-accent h-12">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CONFIRMACIÓN: DEGRADAR A ALUMNA --- */}
      {profeADegradar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center space-y-5 border border-destructive">
            <div className="mx-auto w-16 h-16 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mb-2 shadow-inner">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-foreground tracking-tighter uppercase italic">¿Quitar Rol?</h3>
              <p className="text-muted-foreground text-sm mt-2 font-medium leading-relaxed">
                <strong>{profeADegradar.nombre}</strong> volverá a ser una alumna normal y ya no podrá ver el panel de administración ni el staff.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={ejecutarDegradacion} disabled={procesando} variant="destructive" className="w-full rounded-xl font-bold uppercase tracking-wider h-12">
                {procesando ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Sí, quitar acceso
              </Button>
              <Button onClick={() => setProfeADegradar(null)} disabled={procesando} variant="outline" className="w-full rounded-xl font-bold border-border text-foreground hover:bg-accent h-12">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}