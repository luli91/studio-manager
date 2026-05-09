"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { isSameDay, parseISO } from "date-fns"
import { LayoutDashboard, User, Wallet, LogOut, Loader2 } from "lucide-react"

// Importamos nuestros componentes limpios
import VistaDashboard from "@/components/profe/VistaDashboard"
import VistaActividad from "@/components/profe/VistaActividad"
import VistaPerfil from "@/components/profe/VistaPerfil"

export default function DashboardProfe() {
  const router = useRouter()
  const supabase = createClient()
  
  const [perfil, setPerfil] = useState<any>(null)
  const [clases, setClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [seccion, setSeccion] = useState<"inicio" | "pagos" | "perfil">("inicio")

  const cargarTodo = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push("/login")

    const { data: dataPerfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single()
    if (dataPerfil) setPerfil(dataPerfil)

    const { data: dataClases, error } = await supabase
      .from("clases")
      // ACÁ ESTÁ EL CAMBIO: Agregamos "estado" adentro de reservas
      .select(`id, nivel, horario, fecha, dia_semana, reservas (id, estado, perfiles (*))`)
      .eq("profesor_id", user.id)

    if (!error && dataClases) setClases(dataClases)
    setCargando(false)
  }

  useEffect(() => { cargarTodo() }, [])

  if (cargando) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-fuchsia-600 h-10 w-10" /></div>

  const hoy = new Date()
  const clasesHoy = clases.filter(c => isSameDay(parseISO(c.fecha), hoy))

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      
      {/* SIDEBAR STAFF */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-white/5 min-h-screen">
        <div className="p-8 mb-4"> 
          <h2 className="text-2xl font-black tracking-tight text-white leading-none uppercase">
            POLEKITTY<span className="text-fuchsia-500">STAFF</span>
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Panel de Control</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setSeccion("inicio")} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${seccion === "inicio" ? "bg-fuchsia-600 shadow-lg text-white" : "hover:bg-white/5 text-slate-400"}`}>
            <LayoutDashboard className="h-5 w-5" /> <span className="font-bold text-sm">Dashboard</span>
          </button>
          <button onClick={() => setSeccion("pagos")} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${seccion === "pagos" ? "bg-fuchsia-600 shadow-lg text-white" : "hover:bg-white/5 text-slate-400"}`}>
            <Wallet className="h-5 w-5" /> <span className="font-bold text-sm">Mi Actividad</span>
          </button>
          <button onClick={() => setSeccion("perfil")} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${seccion === "perfil" ? "bg-fuchsia-600 shadow-lg text-white" : "hover:bg-white/5 text-slate-400"}`}>
            <User className="h-5 w-5" /> <span className="font-bold text-sm">Mi Perfil</span>
          </button>
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={() => { supabase.auth.signOut(); router.push("/login") }} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 font-bold text-sm transition-all">
            <LogOut className="h-5 w-5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* RENDERIZADO DINÁMICO DE COMPONENTES */}
      <main className="flex-1 overflow-y-auto p-8">
        {seccion === "inicio" && <VistaDashboard perfil={perfil} clasesHoy={clasesHoy} />}
        {seccion === "pagos" && <VistaActividad clases={clases} hoy={hoy} />}
        {seccion === "perfil" && <VistaPerfil perfil={perfil} alActualizar={cargarTodo} />}
      </main>
    </div>
  )
}