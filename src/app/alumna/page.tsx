"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, CalendarDays, User as UserIcon, CreditCard, Sparkles, LogOut, CheckCircle2, Menu, X, ShoppingBag } from "lucide-react"
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
  const [eventosLanding, setEventosLanding] = useState<any[]>([])
  const [clasesEventos, setClasesEventos] = useState<any[]>([])
  
  // NUEVO: Estados para los Packs de Mercado Pago
  const [packs, setPacks] = useState<any[]>([])
  const [comprando, setComprando] = useState<string | null>(null)

  const [horasCancelacion, setHorasCancelacion] = useState<number>(5) 
  const [procesandoCancelacion, setProcesandoCancelacion] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [seccionActiva, setSeccionActiva] = useState("clases")
  const [menuAbierto, setMenuAbierto] = useState(false)

  // NUEVO: Detectar si viene de pagar con éxito en Mercado Pago
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pagoStatus = urlParams.get('pago');
    
    if (pagoStatus === 'exitoso') {
      toast.success("¡Pago exitoso! Tus nuevas clases ya están acreditadas.");
      // Limpiamos la URL para que no vuelva a saltar el cartel al refrescar
      window.history.replaceState(null, '', window.location.pathname);
    } else if (pagoStatus === 'error') {
      toast.error("Hubo un problema con el pago en Mercado Pago. Intentá nuevamente.");
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [])

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
      .eq("estado", "confirmada") 
      .gte("fecha_clase", hoy)
      .order("fecha_clase", { ascending: true })

    if (dataReservas) setMisReservas(dataReservas)

    const { data: dataPagos } = await supabase
      .from("pagos")
      .select("*")
      .eq("perfil_id", user.id)
      .order("fecha", { ascending: false })

    if (dataPagos) setMisPagos(dataPagos)

    const { data: dataEventos } = await supabase.from("landing_eventos").select("*").eq("activo", true)
    if (dataEventos) setEventosLanding(dataEventos)

    const { data: dataClasesEventos } = await supabase.from("clases").select("*").eq("es_evento", true)
    if (dataClasesEventos) setClasesEventos(dataClasesEventos)

    // NUEVO: Leemos los precios desde la configuración de Flor
    const { data: configPrecios } = await supabase.from("configuracion").select("valor").eq("key", "precios_packs").single()
    if (configPrecios && configPrecios.valor) {
      const packsFormateados = Object.entries(configPrecios.valor)
        .map(([cantidad, precio]) => ({
          id: `pack-${cantidad}`,
          nombre: cantidad === "1" ? "Clase Suelta" : `Pack ${cantidad} Clases`,
          cantidad_clases: Number(cantidad),
          precio: Number(precio)
        }))
        .sort((a, b) => a.cantidad_clases - b.cantidad_clases); 
      
      setPacks(packsFormateados);
    }

    const { data: config } = await supabase.from("configuracion").select("valor").eq("key", "reglas").single()
    if (config?.valor?.horas_cancelacion) setHorasCancelacion(config.valor.horas_cancelacion)

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

      if (diferenciaHoras < horasCancelacion) {
        throw new Error(`No podés cancelar con menos de ${horasCancelacion} horas de anticipación. Contactate con el estudio.`)
      }

      const { error: errReserva } = await supabase.from("reservas").update({ estado: 'cancelada' }).eq("id", reserva.id)
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

  // NUEVO: Función para generar el link de pago y redirigir
  const handleComprarPack = async (pack: any) => {
    setComprando(pack.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pack: pack,
          perfilId: perfil.id
        }),
      });
      
      const data = await res.json();
      
      if (data.init_point) {
        window.location.href = data.init_point; // Redirige a Mercado Pago
      } else {
        toast.error("Error al conectar con Mercado Pago.");
        setComprando(null);
      }
    } catch (error) {
      toast.error("Ocurrió un error de conexión.");
      setComprando(null);
    }
  }

  if (cargando) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      
      <button 
        className="md:hidden fixed top-4 left-4 z-50 bg-primary p-2 rounded-md text-primary-foreground shadow-lg"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {menuAbierto && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden" onClick={() => setMenuAbierto(false)}/>
      )}

      <aside className={`fixed top-0 left-0 h-screen w-64 bg-slate-950 text-slate-50 p-8 flex flex-col z-40 transform transition-transform duration-300 ${menuAbierto ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 shadow-xl border-r border-border/10`}>
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-1 block"> 
            <Image 
              src="/LOGO-POLEKITTY-Flor.png" 
              alt="Logo Alumnas"
              width={90}    
              height={30}    
              className="object-contain w-auto h-auto invert" 
              priority
            />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white leading-none uppercase mt-3">
            POLEKITTY<span className="text-slate-300 font-black ml-1">PANEL</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold italic">
            ¡Hola, {perfil?.nombre || 'Alumna'}!
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => {setSeccionActiva("clases"); setMenuAbierto(false)}} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${seccionActiva === "clases" ? "bg-primary shadow-lg text-primary-foreground" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
            <CalendarDays className="h-5 w-5" /> <span className="font-bold text-sm">Mis Clases</span>
          </button>
          
          {/* NUEVO BOTÓN EN EL MENÚ PARA LA TIENDA */}
          <button onClick={() => {setSeccionActiva("tienda"); setMenuAbierto(false)}} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${seccionActiva === "tienda" ? "bg-primary shadow-lg text-primary-foreground" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
            <ShoppingBag className="h-5 w-5" /> <span className="font-bold text-sm">Comprar Clases</span>
          </button>

          <button onClick={() => {setSeccionActiva("eventos"); setMenuAbierto(false)}} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${seccionActiva === "eventos" ? "bg-primary shadow-lg text-primary-foreground" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
            <Sparkles className="h-5 w-5" /> <span className="font-bold text-sm">Eventos</span>
          </button>
          <button onClick={() => {setSeccionActiva("pagos"); setMenuAbierto(false)}} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${seccionActiva === "pagos" ? "bg-primary shadow-lg text-primary-foreground" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
            <CreditCard className="h-5 w-5" /> <span className="font-bold text-sm">Mis Pagos</span>
          </button>
          <button onClick={() => {setSeccionActiva("perfil"); setMenuAbierto(false)}} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${seccionActiva === "perfil" ? "bg-primary shadow-lg text-primary-foreground" : "hover:bg-white/5 text-slate-400 hover:text-white"}`}>
            <UserIcon className="h-5 w-5" /> <span className="font-bold text-sm">Mi Perfil</span>
          </button>
        </nav>

        <div className="pt-6 border-t border-white/5 mt-auto">
          <button onClick={handleCerrarSesion} className="w-full flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white font-bold text-sm transition-all">
            <LogOut className="h-5 w-5" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 h-screen">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Resumen de cuenta</h1>
              <p className="text-muted-foreground text-sm">Gestioná tus reservas y tu información personal.</p>
            </div>
            <div className="flex items-center gap-3 bg-secondary px-4 py-2 rounded-lg border border-border">
              <div className="bg-background p-2 rounded-full border border-border">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Clases Disponibles</p>
                <p className="text-xl font-black text-foreground">{perfil?.creditos_clases || 0}</p>
              </div>
            </div>
          </div>

          {seccionActiva === "clases" && <VistaClases perfil={perfil} misReservas={misReservas} onCancelar={handleCancelarReserva} procesandoCancelacion={procesandoCancelacion} onRecargar={cargarPerfilYReservas} horasCancelacion={horasCancelacion} />}
          {seccionActiva === "perfil" && <VistaPerfil perfil={perfil} alActualizar={cargarPerfilYReservas} />}
          {seccionActiva === "pagos" && <VistaPagos misPagos={misPagos} />}
          
          {/* NUEVA VISTA: TIENDA / COMPRAR CLASES */}
          {seccionActiva === "tienda" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Comprar Clases</h2>
                </div>
                <p className="text-muted-foreground text-sm">Adquirí tus clases de forma rápida y segura a través de Mercado Pago. Los créditos se sumarán automáticamente a tu cuenta.</p>
              </div>

              {packs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packs.map(pack => (
                    <div key={pack.id} className="bg-card border border-primary/20 rounded-xl overflow-hidden shadow-sm flex flex-col p-6 hover:shadow-md transition-all relative">
                      <div className="flex-1 text-center">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                        {pack.cantidad_clases === 1 ? 'Clase Suelta' : 'Pack Automático'}
                        </span>
                        <h3 className="text-2xl font-black uppercase text-foreground">{pack.nombre}</h3>
                        <p className="text-4xl font-black text-primary mt-4 mb-2">${pack.precio}</p>
                        <p className="text-muted-foreground text-sm font-bold">Te carga {pack.cantidad_clases} {pack.cantidad_clases === 1 ? 'crédito' : 'créditos'}</p>
                      </div>
                      <div className="pt-6 mt-6 border-t border-border">
                        <Button 
                          onClick={() => handleComprarPack(pack)} 
                          className="w-full font-bold uppercase tracking-widest bg-[#009EE3] hover:bg-[#008CC9] text-white"
                          disabled={comprando !== null}
                        >
                          {comprando === pack.id ? <Loader2 className="h-5 w-5 animate-spin" /> : "Pagar con Mercado Pago"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-12 shadow-sm text-center">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h3 className="text-xl font-bold text-foreground">No hay packs disponibles</h3>
                  <p className="text-muted-foreground mt-2">En este momento no hay packs a la venta. Consultá con la administración.</p>
                </div>
              )}
            </div>
          )}

          {seccionActiva === "eventos" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Próximos Eventos y Masterclasses</h2>
                </div>
                <p className="text-muted-foreground text-sm">Descubrí las clases especiales y eventos que tenemos preparados en el estudio.</p>
              </div>

              {(eventosLanding.length > 0 || clasesEventos.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {eventosLanding.map(ev => (
                    <div key={ev.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                      <div className="h-48 relative bg-slate-100">
                        {ev.imagen_url ? (
                          <img src={ev.imagen_url} alt={ev.titulo} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            <CalendarDays className="h-10 w-10 opacity-30" />
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-xl font-black uppercase text-foreground">{ev.titulo}</h3>
                        <p className="text-muted-foreground mt-2 mb-6 flex-1 text-sm">{ev.descripcion}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <span className="text-lg font-black text-foreground">${ev.precio}</span>
                          <Button onClick={() => window.open(`https://wa.me/5491141429761?text=Hola Flor! Quiero info/anotarme al evento: ${ev.titulo}`, '_blank')} className="font-bold">Consultar</Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {clasesEventos.map(clase => (
                    <div key={clase.id} className="bg-card border border-primary/20 rounded-xl overflow-hidden shadow-sm flex flex-col p-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Clase Especial</span>
                          <span className="font-bold text-muted-foreground">{clase.dia_semana} {clase.horario}</span>
                        </div>
                        <h3 className="text-xl font-black uppercase text-foreground mt-2">{clase.nivel || "Clase Especial de la semana"}</h3>
                        <p className="text-muted-foreground mt-2 text-sm">Esta clase está marcada como evento en la grilla y requiere <strong className="text-foreground">{clase.costo_creditos} crédito(s)</strong> para anotarse.</p>
                      </div>
                      <div className="pt-6 mt-4 border-t border-border">
                        <Button onClick={() => setSeccionActiva("clases")} variant="outline" className="w-full font-bold">Ir a la Grilla para Reservar</Button>
                      </div>
                    </div>
                  ))}

                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-12 shadow-sm text-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h3 className="text-xl font-bold text-foreground">No hay eventos activos</h3>
                  <p className="text-muted-foreground mt-2">Pronto anunciaremos nuevos eventos, workshops y masterclasses.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}