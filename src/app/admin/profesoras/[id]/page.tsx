"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { 
  ArrowLeft, Mail, Phone, MapPin, CalendarDays, 
  Clock, Loader2, Plus, UserMinus, Wallet, AlertCircle, CheckCircle2, AlertTriangle, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { format, parseISO, isSameDay, isBefore, isAfter, isSameMonth, isSameWeek } from "date-fns"
import { es } from "date-fns/locale"

import ModalAsignarClase from "@/components/admin/ModalAsignarClase"

export default function DetalleProfe() {
  const { id } = useParams()
  const supabase = createClient()
  
  const [profe, setProfe] = useState<any>(null)
  const [clasesAsignadas, setClasesAsignadas] = useState<any[]>([])
  const [todasLasClases, setTodasLasClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)

  // NUEVOS ESTADOS PARA EL MODAL DE AUSENCIA
  const [claseAAusentar, setClaseAAusentar] = useState<any | null>(null)
  const [marcandoAusencia, setMarcandoAusencia] = useState(false)

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [resProfe, resAsignadas, resTodas] = await Promise.all([
        supabase.from("perfiles").select("*").eq("id", id).single(),
        supabase.from("clases")
          .select("*")
          .or(`profesor_id.eq.${id},profesor_ausente_id.eq.${id}`) 
          .order("fecha", { ascending: true })
          .order("horario", { ascending: true }),
        supabase.from("clases")
          .select("*")
          .is("profesor_id", null)
          .order("fecha", { ascending: true })
          .order("horario", { ascending: true })
          .range(0, 1000)
      ])
      
      if (resProfe.data) setProfe(resProfe.data)
      if (resAsignadas.data) setClasesAsignadas(resAsignadas.data)
      if (resTodas.data) setTodasLasClases(resTodas.data)
    } catch (error) {
      toast.error("Error al cargar los datos")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { 
    if (id) cargarDatos() 
  }, [id])

  const asignarClase = async (claseId: string) => {
    const { error } = await supabase.from("clases").update({ profesor_id: id, profesor_ausente_id: null }).eq("id", claseId)
    if (error) return toast.error("Error al asignar")
    toast.success("Clase asignada correctamente")
    cargarDatos()
  }

  const confirmarAusencia = async () => {
    if (!claseAAusentar) return
    setMarcandoAusencia(true)

    try {
      const { error } = await supabase.from("clases").update({ 
        profesor_id: null, 
        profesor_ausente_id: id 
      }).eq("id", claseAAusentar.id)

      if (error) throw error
      
      toast.info("Ausencia registrada", { description: "La clase está libre para suplencias." })
      setClaseAAusentar(null) 
      cargarDatos()
    } catch (error) {
      toast.error("Error al marcar ausencia")
    } finally {
      setMarcandoAusencia(false)
    }
  }

  const hoy = new Date()
  
  const clasesHoy = clasesAsignadas.filter(c => isSameDay(parseISO(c.fecha), hoy))
  const clasesProximas = clasesAsignadas.filter(c => isAfter(parseISO(c.fecha), hoy) && !isSameDay(parseISO(c.fecha), hoy))
  const clasesHistorial = clasesAsignadas.filter(c => isBefore(parseISO(c.fecha), hoy) && !isSameDay(parseISO(c.fecha), hoy)).reverse()

  const clasesRealizadas = clasesHistorial.filter(c => c.profesor_id === id)
  const totalMesActual = clasesRealizadas.filter(c => isSameMonth(parseISO(c.fecha), hoy)).length
  const totalSemanaActual = clasesRealizadas.filter(c => isSameWeek(parseISO(c.fecha), hoy, { weekStartsOn: 1 })).length

  if (cargando) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-fuchsia-600 h-10 w-10" /></div>

  const TarjetaClase = ({ clase, tipo }: { clase: any, tipo: 'hoy' | 'proxima' | 'historial' }) => {
    const esAusente = clase.profesor_ausente_id === id;
    const esEvento = clase.es_evento;
    
    let colorBorde = "border-slate-200";
    let colorFondoDia = "bg-slate-100 text-slate-500";
    let etiqueta = null;

    if (esAusente) {
      colorBorde = "border-red-200 bg-red-50/30";
      colorFondoDia = "bg-red-100 text-red-600";
      etiqueta = <span className="text-[9px] font-black text-red-600 uppercase bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="h-3 w-3"/> Ausente</span>;
    } else if (esEvento) {
       colorBorde = "border-amber-200 bg-amber-50/30";
       colorFondoDia = "bg-amber-100 text-amber-700";
       etiqueta = <span className="text-[9px] font-black text-amber-600 uppercase bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles className="h-3 w-3"/> Evento</span>;
    } else if (tipo === 'hoy') {
      colorBorde = "border-fuchsia-300 shadow-md bg-fuchsia-50/30";
      colorFondoDia = "bg-fuchsia-600 text-white";
      etiqueta = <span className="text-[9px] font-black text-fuchsia-600 uppercase bg-fuchsia-100 px-2 py-0.5 rounded-full animate-pulse">Hoy</span>;
    } else if (tipo === 'historial') {
      colorFondoDia = "bg-emerald-100 text-emerald-700";
      etiqueta = <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Dictada</span>;
    } else {
      colorFondoDia = "bg-blue-100 text-blue-700";
      etiqueta = <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full">Programada</span>;
    }

    return (
      <div className={`p-5 bg-white border ${colorBorde} rounded-[2rem] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-all group`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl text-center min-w-[4rem] shadow-sm ${colorFondoDia}`}>
            <p className="text-[10px] font-black uppercase leading-none mb-1 opacity-80">{format(parseISO(clase.fecha), 'EEE', { locale: es })}</p>
            <p className="text-xl font-black leading-none">{format(parseISO(clase.fecha), 'dd')}</p>
          </div>
          <div>
            <p className={`font-bold uppercase text-lg leading-tight tracking-tight ${esAusente ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
              {clase.nivel}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {clase.horario.slice(0,5)} hs
              </p>
              {etiqueta}
            </div>
          </div>
        </div>
        
        {(tipo === 'hoy' || tipo === 'proxima') && !esAusente && (
          <Button 
            onClick={() => setClaseAAusentar(clase)} 
            variant="ghost" 
            className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl font-bold text-xs h-10 transition-colors self-end sm:self-auto opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            <UserMinus className="h-4 w-4 mr-2" /> Faltará (Liberar)
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <Link href="/admin/profesoras">
          <Button variant="ghost" className="gap-2 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-200 rounded-2xl">
            <ArrowLeft className="h-4 w-4" /> Volver al Staff
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm text-center sticky top-8">
            <div className="h-28 w-28 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center text-5xl font-black mx-auto mb-4 shadow-lg shadow-slate-900/20">
              {profe?.nombre?.charAt(0) || profe?.nombre_completo?.charAt(0)}
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-none">
              {profe?.nombre} {profe?.apellido}
            </h2>
            <p className="text-fuchsia-600 text-[10px] font-black uppercase tracking-widest mt-2">Profesora Titular</p>
            
            <div className="mt-8 space-y-4 text-left bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <Mail className="h-4 w-4 text-slate-400" /> <span className="truncate">{profe?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <Phone className="h-4 w-4 text-slate-400" /> {profe?.telefono || "Sin teléfono"}
              </div>
              <div className="flex items-center gap-3 text-slate-700 text-sm font-medium items-start">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" /> 
                <span>
                  {profe?.calle ? (
                    <>
                      {profe.calle} {profe.numero_calle}, <br/>
                      <span className="text-xs text-slate-500">{profe.barrio_localidad} ({profe.provincia})</span>
                    </>
                  ) : (
                    profe?.direccion || "Sin dirección"
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 bg-slate-900 p-6 rounded-3xl text-white">
              <h3 className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                <Wallet className="h-3 w-3" /> Liquidación {format(hoy, "MMMM", { locale: es })}
              </h3>
              <div className="flex justify-around items-center">
                <div className="text-center">
                  <p className="text-4xl font-black">{totalMesActual}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-bold mt-1">Mes Actual</p>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="text-center">
                  <p className="text-4xl font-black text-emerald-400">{totalSemanaActual}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-bold mt-1">Esta Semana</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Grilla de la Profe</h3>
              <p className="text-sm text-slate-500 font-medium">Gestión de cronograma y asistencias</p>
            </div>
            <Button 
              onClick={() => setModalAbierto(true)} 
              className="bg-fuchsia-600 hover:bg-slate-900 text-white rounded-2xl h-12 px-6 font-black uppercase tracking-widest transition-all shadow-lg shadow-fuchsia-900/20 w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" /> Asignar Clase
            </Button>
          </div>

          {clasesAsignadas.length === 0 ? (
            <div className="p-16 border-2 border-dashed border-slate-200 rounded-[3rem] text-center text-slate-400 bg-white">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-bold uppercase tracking-widest text-xs">Sin clases registradas</p>
            </div>
          ) : (
            <div className="space-y-10">
              
              {clasesHoy.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-fuchsia-500 uppercase tracking-widest px-4 border-b border-fuchsia-100 pb-2 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Clases de Hoy
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {clasesHoy.map(c => <TarjetaClase key={c.id} clase={c} tipo="hoy" />)}
                  </div>
                </div>
              )}

              {clasesProximas.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest px-4 border-b border-blue-100 pb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Próximas Clases
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {clasesProximas.map(c => <TarjetaClase key={c.id} clase={c} tipo="proxima" />)}
                  </div>
                </div>
              )}

              {clasesHistorial.length > 0 && (
                <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Historial
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {clasesHistorial.map(c => <TarjetaClase key={c.id} clase={c} tipo="historial" />)}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      <ModalAsignarClase 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)} 
        clasesLibres={todasLasClases} 
        onAsignar={asignarClase} 
      />

      {claseAAusentar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-6 text-center space-y-5">
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2 shadow-inner">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-slate-900 tracking-tighter">¿Marcar Ausencia?</h3>
              <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed">
                Vas a reportar que la profe faltará a la clase de <strong className="text-slate-900 uppercase">{claseAAusentar.nivel}</strong> del {format(parseISO(claseAAusentar.fecha), "dd/MM")}.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-2xl text-xs font-medium text-left">
              <AlertTriangle className="h-4 w-4 inline-block mr-1.5 mb-0.5 text-amber-600" />
              La clase quedará sin profesora y <strong>libre para suplencias</strong>, pero la ausencia quedará en el historial.
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={confirmarAusencia} disabled={marcandoAusencia} className="w-full rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 h-12">
                {marcandoAusencia ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {marcandoAusencia ? "Guardando..." : "Sí, marcar ausente"}
              </Button>
              <Button onClick={() => setClaseAAusentar(null)} disabled={marcandoAusencia} variant="outline" className="w-full rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-100 h-12">
                Cancelar
              </Button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}