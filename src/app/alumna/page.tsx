"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, CalendarDays, User as UserIcon, CreditCard, Sparkles, LogOut, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

import VistaClases from "@/components/alumnas/VistaClases"
import VistaPerfil from "@/components/alumnas/VistaPerfil"
import VistaPagos from "@/components/alumnas/VistaPagos"

export default function DashboardAlumna() {
  const router = useRouter()
  const supabase = createClient()

  const [perfil, setPerfil] = useState<any>(null)
  const [misReservas, setMisReservas] = useState<any[]>([])
  const [misPagos, setMisPagos] = useState<any[]>([])
  
  const [procesandoCancelacion, setProcesandoCancelacion] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [seccionActiva, setSeccionActiva] = useState("clases")

  const cargarPerfilYReservas = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push("/login")

    const { data: dataPerfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single()
    if (dataPerfil) setPerfil(dataPerfil)

    const hoy = new Date().toISOString().split('T')[0]
    const { data: dataReservas } = await supabase
      .from("reservas")
      .select(`id, estado, fecha_clase, clases (nivel, horario, dia_semana, es_evento, costo_creditos)`)
      .eq("perfil_id", user.id)
      .gte("fecha_clase", hoy)
      .order("fecha_clase", { ascending: true })

    if (dataReservas) setMisReservas(dataReservas)

    const { data: dataPagos } = await supabase
      .from("pagos")
      .select("*")
      .eq("perfil_id", user.id)
      .order("fecha", { ascending: false })

    if (dataPagos) setMisPagos(dataPagos)
    setCargando(false)
  }

  useEffect(() => { cargarPerfilYReservas() }, [router, supabase])

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push("/login")
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

  if (cargando) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-fuchsia-600" /></div>

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

          {/* RENDERIZADO DINÁMICO */}
          {seccionActiva === "clases" && <VistaClases perfil={perfil} misReservas={misReservas} onCancelar={handleCancelarReserva} procesandoCancelacion={procesandoCancelacion} onRecargar={cargarPerfilYReservas} />}
          {seccionActiva === "perfil" && <VistaPerfil perfil={perfil} alActualizar={cargarPerfilYReservas} />}
          {seccionActiva === "pagos" && <VistaPagos misPagos={misPagos} />}
          
          {seccionActiva === "eventos" && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 shadow-sm text-center">
              <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-slate-800">Eventos de la comunidad</h3>
              <p className="text-slate-500 mt-2">Pronto anunciaremos nuevos eventos, workshops y masterclasses.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}