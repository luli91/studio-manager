"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { isSameDay, parseISO } from "date-fns"
import { LayoutDashboard, User, Wallet, LogOut, Loader2, Menu, X } from "lucide-react"

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
  const [menuAbierto, setMenuAbierto] = useState(false) // <-- ESTO ES LO QUE FALTABA

  const cargarTodo = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push("/login")

    const { data: dataPerfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single()
    if (dataPerfil) setPerfil(dataPerfil)

    const { data: dataClases, error } = await supabase
      .from("clases")
      .select(`id, nivel, horario, fecha, dia_semana, profesor_ausente_id, reservas (id, estado, perfiles (*))`)
      .or(`profesor_id.eq.${user.id},profesor_ausente_id.eq.${user.id}`)

    if (!error && dataClases) setClases(dataClases)
    setCargando(false)
  }

  useEffect(() => { cargarTodo() }, [])

  if (cargando) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>

  const hoy = new Date()
  const clasesHoy = clases.filter(c => isSameDay(parseISO(c.fecha), hoy))

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      
      {/* Botón Hamburguesa (Mobile) */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 bg-primary p-2 rounded-md text-primary-foreground shadow-lg"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay Oscuro (Mobile) */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* SIDEBAR STAFF (Ahora con fondo oscuro y responsive) */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-slate-950 text-slate-50 p-8 flex flex-col z-40 transform transition-transform duration-300 ${menuAbierto ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 shadow-xl border-r border-border/10`}>
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-1 block"> 
            <Image 
              src="/LOGO-POLEKITTY-Flor.png" 
              alt="Logo Staff"
              width={90}    
              height={30}    
              className="object-contain invert" 
              priority
            />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white leading-none uppercase mt-3">
            POLEKITTY<span className="text-slate-300 font-black ml-1">STAFF</span>
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold italic">Panel de Control</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => {setSeccion("inicio"); setMenuAbierto(false)}} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${seccion === "inicio" ? "bg-primary shadow-lg text-primary-foreground" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
            <LayoutDashboard className="h-5 w-5" /> <span className="font-bold text-sm">Dashboard</span>
          </button>
          <button onClick={() => {setSeccion("pagos"); setMenuAbierto(false)}} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${seccion === "pagos" ? "bg-primary shadow-lg text-primary-foreground" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
            <Wallet className="h-5 w-5" /> <span className="font-bold text-sm">Mi Actividad</span>
          </button>
          <button onClick={() => {setSeccion("perfil"); setMenuAbierto(false)}} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${seccion === "perfil" ? "bg-primary shadow-lg text-primary-foreground" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
            <User className="h-5 w-5" /> <span className="font-bold text-sm">Mi Perfil</span>
          </button>
        </nav>
        <div className="pt-6 border-t border-white/5 mt-auto">
          <button onClick={() => { supabase.auth.signOut(); router.push("/login") }} className="w-full flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white font-bold text-sm transition-all">
            <LogOut className="h-5 w-5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 h-screen">
        <div className="max-w-6xl mx-auto">
          {seccion === "inicio" && <VistaDashboard perfil={perfil} clasesHoy={clasesHoy} />}
          {seccion === "pagos" && <VistaActividad clases={clases} hoy={hoy} />}
          {seccion === "perfil" && <VistaPerfil perfil={perfil} alActualizar={cargarTodo} />}
        </div>
      </main>
    </div>
  )
}