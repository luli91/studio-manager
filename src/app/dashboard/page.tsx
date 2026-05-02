"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, CalendarDays, User as UserIcon, CreditCard, Sparkles, LogOut, CheckCircle2, Pencil, X, Save, Clock } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import GrillaReservas from "@/components/alumnas/GrillaReservas"

export default function DashboardAlumna() {
  const router = useRouter()
  const supabase = createClient()

  const [perfil, setPerfil] = useState<any>(null)
  const [misReservas, setMisReservas] = useState<any[]>([])
  
  // ACÁ ESTÁ EL ESTADO QUE TE FALTABA PARA LOS PAGOS
  const [misPagos, setMisPagos] = useState<any[]>([])
  
  const [procesandoCancelacion, setProcesandoCancelacion] = useState<string | null>(null)
  
  const [cargando, setCargando] = useState(true)
  const [seccionActiva, setSeccionActiva] = useState("clases")

  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo: "",
    telefono: "",
    contacto_urgencia: "",
    direccion: ""
  })

  const cargarPerfilYReservas = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    const { data: dataPerfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single()
    if (dataPerfil) {
      setPerfil(dataPerfil)
      setFormData({
        nombre_completo: dataPerfil.nombre_completo || "",
        telefono: dataPerfil.telefono || "",
        contacto_urgencia: dataPerfil.contacto_urgencia || "",
        direccion: dataPerfil.direccion || ""
      })
    }

    const hoy = new Date().toISOString().split('T')[0]
    const { data: dataReservas } = await supabase
      .from("reservas")
      .select(`id, estado, fecha_clase, clases (nivel, horario, dia_semana, es_evento, costo_creditos)`)
      .eq("perfil_id", user.id)
      .gte("fecha_clase", hoy)
      .order("fecha_clase", { ascending: true })

    if (dataReservas) setMisReservas(dataReservas)

    // ACÁ ESTÁ LA BÚSQUEDA A LA BASE DE DATOS QUE TRAE TUS RECIBOS
    const { data: dataPagos } = await supabase
      .from("pagos")
      .select("*")
      .eq("perfil_id", user.id)
      .order("fecha", { ascending: false })

    if (dataPagos) setMisPagos(dataPagos)

    setCargando(false)
  }

  useEffect(() => {
    cargarPerfilYReservas()
  }, [router, supabase])

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleGuardarCambios = async () => {
    setGuardando(true)
    try {
      const { error } = await supabase
        .from("perfiles")
        .update(formData)
        .eq("id", perfil.id)

      if (error) throw new Error("No pudimos actualizar tus datos.")

      setPerfil({ ...perfil, ...formData })
      setEditando(false)
      toast.success("¡Datos actualizados con éxito!")
      
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelarReserva = async (reserva: any) => {
    setProcesandoCancelacion(reserva.id)

    try {
      const fechaHoraClase = new Date(`${reserva.fecha_clase}T${reserva.clases.horario}`)
      const ahora = new Date()
      const diferenciaHoras = (fechaHoraClase.getTime() - ahora.getTime()) / (1000 * 60 * 60)

      if (diferenciaHoras < 12) {
        throw new Error("No podés cancelar con menos de 12 horas de anticipación. Contactate con el estudio.")
      }

      const { error: errReserva } = await supabase.from("reservas").delete().eq("id", reserva.id)
      if (errReserva) throw errReserva

      const costo = reserva.clases?.costo_creditos ?? 1
      const nuevosCreditos = perfil.creditos_clases + costo

      const { error: errPerfil } = await supabase.from("perfiles").update({ creditos_clases: nuevosCreditos }).eq("id", perfil.id)
      if (errPerfil) throw errPerfil

      toast.success("Reserva cancelada. ¡Recuperaste tu clase!")
      await cargarPerfilYReservas()

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcesandoCancelacion(null)
    }
  }

  // Se modificó para que acepte la fecha que viene de Supabase (que a veces tiene un espacio en lugar de T)
  const formatearFechaHermosa = (fechaString: string) => {
    if(!fechaString) return ""
    const fechaLimpia = fechaString.split('T')[0].split(' ')[0]
    const [año, mes, dia] = fechaLimpia.split('-')
    return `${dia}/${mes}`
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-fuchsia-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* MENÚ LATERAL */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm shrink-0">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            POLE<span className="text-fuchsia-600">KITTY</span>
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">¡Hola, {perfil?.nombre_completo?.split(' ')[0] || 'Alumna'}!</p>
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 flex-1">
          <Button variant={seccionActiva === "clases" ? "default" : "ghost"} className={`justify-start font-medium ${seccionActiva === "clases" ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`} onClick={() => setSeccionActiva("clases")}>
            <CalendarDays className="mr-3 h-5 w-5" /> Mis Clases
          </Button>
          <Button variant={seccionActiva === "perfil" ? "default" : "ghost"} className={`justify-start font-medium ${seccionActiva === "perfil" ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`} onClick={() => setSeccionActiva("perfil")}>
            <UserIcon className="mr-3 h-5 w-5" /> Mi Perfil
          </Button>
          <Button variant={seccionActiva === "pagos" ? "default" : "ghost"} className={`justify-start font-medium ${seccionActiva === "pagos" ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`} onClick={() => setSeccionActiva("pagos")}>
            <CreditCard className="mr-3 h-5 w-5" /> Mis Pagos
          </Button>
          <Button variant={seccionActiva === "eventos" ? "default" : "ghost"} className={`justify-start font-medium ${seccionActiva === "eventos" ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`} onClick={() => setSeccionActiva("eventos")}>
            <Sparkles className="mr-3 h-5 w-5" /> Eventos
          </Button>
        </nav>

        <div className="mt-auto pt-4 md:pt-8 border-t border-slate-100">
          <Button variant="ghost" onClick={handleCerrarSesion} className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="mr-3 h-5 w-5" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* HEADER DEL DASHBOARD */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Resumen de cuenta</h1>
              <p className="text-slate-500 text-sm">Gestioná tus reservas y tu información personal.</p>
            </div>
            <div className="flex items-center gap-3 bg-fuchsia-50 px-4 py-2 rounded-lg border border-fuchsia-100">
              <div className="bg-fuchsia-100 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-fuchsia-600" />
              </div>
              <div>
                <p className="text-xs text-fuchsia-600 font-semibold uppercase tracking-wider">Clases Disponibles</p>
                <p className="text-xl font-black text-slate-900">{perfil?.creditos_clases || 0}</p>
              </div>
            </div>
          </div>

          {/* SECCIÓN: CLASES */}
          {seccionActiva === "clases" && (
            <div className="space-y-8">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-xl text-slate-800">Mis próximas reservas</CardTitle>
                  <CardDescription>No te olvides de cancelar con 12hs de anticipación.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {misReservas.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      Todavía no tenés reservas activas. ¡Anotate a una clase en la grilla de abajo!
                    </div>
                  ) : (
                    <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                      {misReservas.map(reserva => (
                        <div key={reserva.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-fuchsia-200 transition-colors gap-4">
                          <div className="flex items-center gap-4">
                            <div className="bg-fuchsia-50 p-3 rounded-xl text-fuchsia-700 flex flex-col items-center justify-center min-w-[70px]">
                              <p className="text-xs font-bold uppercase">{reserva.clases?.dia_semana.slice(0,3)}</p>
                              <p className="text-lg font-black">{formatearFechaHermosa(reserva.fecha_clase)}</p>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                {reserva.clases?.nivel}
                                {reserva.clases?.es_evento && <Sparkles className="h-3 w-3 text-amber-500" />}
                              </h4>
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" /> {reserva.clases?.horario.slice(0,5)} hs
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={() => handleCancelarReserva(reserva)}
                            disabled={procesandoCancelacion === reserva.id}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto transition-colors"
                          >
                            {procesandoCancelacion === reserva.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Cancelar reserva
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-fuchsia-100 pb-4 bg-fuchsia-50">
                  <CardTitle className="text-xl text-fuchsia-900">Grilla de Horarios</CardTitle>
                  <CardDescription className="text-fuchsia-700">Elegí tu clase y asegurá tu lugar en el caño.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 bg-slate-50">
                  <GrillaReservas perfil={perfil} onReservaExitosa={cargarPerfilYReservas} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECCIÓN: PERFIL */}
          {seccionActiva === "perfil" && (
             <Card className="border-slate-200 shadow-sm">
             <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
               <div>
                 <CardTitle className="text-xl text-slate-800">Ficha personal</CardTitle>
                 <CardDescription>Mantené tu información de contacto actualizada.</CardDescription>
               </div>
               {!editando && (
                 <Button variant="outline" size="sm" onClick={() => setEditando(true)} className="text-slate-600 border-slate-300 hover:bg-slate-50">
                   <Pencil className="h-4 w-4 mr-2" /> Editar datos
                 </Button>
               )}
             </CardHeader>
             <CardContent className="pt-6">
               {!editando ? (
                 <div className="space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre completo</p>
                       <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-md border border-slate-100">{perfil?.nombre_completo}</p>
                     </div>
                     <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email registrado</p>
                       <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-md border border-slate-100 text-slate-500">{perfil?.email} 🔒</p>
                     </div>
                   </div>
                   <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Personal</p>
                       <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-md border border-slate-100">{perfil?.telefono}</p>
                     </div>
                     <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tel. Emergencia</p>
                       <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-md border border-slate-100">{perfil?.contacto_urgencia}</p>
                     </div>
                   </div>
                   <div className="space-y-1">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dirección</p>
                     <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-md border border-slate-100">{perfil?.direccion}</p>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <Label htmlFor="edit-nombre" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre completo</Label>
                       <Input id="edit-nombre" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} className="bg-white" />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email (No editable)</Label>
                       <Input value={perfil?.email} disabled className="bg-slate-100 text-slate-500 cursor-not-allowed" />
                     </div>
                   </div>
                   <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <Label htmlFor="edit-tel" className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Personal</Label>
                       <Input id="edit-tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="bg-white" />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="edit-urgencia" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tel. Emergencia</Label>
                       <Input id="edit-urgencia" value={formData.contacto_urgencia} onChange={(e) => setFormData({...formData, contacto_urgencia: e.target.value})} className="bg-white" />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="edit-dir" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección</Label>
                     <Input id="edit-dir" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} className="bg-white" />
                   </div>
                   <div className="flex gap-3 pt-4 border-t border-slate-100">
                     <Button onClick={handleGuardarCambios} disabled={guardando} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
                       {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                       Guardar cambios
                     </Button>
                     <Button variant="ghost" onClick={() => setEditando(false)} disabled={guardando} className="text-slate-500 hover:text-slate-700">
                       <X className="mr-2 h-4 w-4" /> Cancelar
                     </Button>
                   </div>
                 </div>
               )}
             </CardContent>
           </Card>
          )}

          {/* ESTA ES LA SECCIÓN MÁGICA DE LOS PAGOS QUE AHORA SÍ ESTÁ */}
          {seccionActiva === "pagos" && (
             <Card className="border-slate-200 shadow-sm">
             <CardHeader className="border-b border-slate-100 pb-4">
               <CardTitle className="text-xl text-slate-800">Historial de compras</CardTitle>
               <CardDescription>Revisá tus recibos y los packs que compraste.</CardDescription>
             </CardHeader>
             <CardContent className="pt-6">
               
               {misPagos.length === 0 ? (
                 <div className="text-center py-12">
                   <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                   <p className="text-slate-500 font-medium">No hay pagos registrados todavía.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {misPagos.map((pago) => (
                     <div key={pago.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-fuchsia-200 transition-colors">
                       <div className="flex items-center gap-4">
                         <div className="bg-emerald-50 p-3 rounded-full text-emerald-600">
                           <CreditCard className="h-6 w-6" />
                         </div>
                         <div>
                           <p className="font-bold text-slate-900">Pack de {pago.cantidad_clases} clases</p>
                           <p className="text-sm text-slate-500">{formatearFechaHermosa(pago.fecha)} • {pago.metodo_pago}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-lg font-black text-slate-900">${pago.monto}</p>
                         <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-wider">Aprobado</span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}

             </CardContent>
           </Card>
          )}

          {/* SECCIÓN: EVENTOS */}
          {seccionActiva === "eventos" && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl text-slate-800">Eventos de la comunidad</CardTitle>
                <CardDescription>Seminarios especiales y encuentros.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Pronto anunciaremos nuevos eventos.</p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>

    </div>
  )
}