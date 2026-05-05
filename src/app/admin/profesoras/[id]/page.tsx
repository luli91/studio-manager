"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { 
  ArrowLeft, Mail, Phone, MapPin, CalendarDays, 
  Clock, Loader2, Plus, UserMinus, Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { format, parseISO, isSameDay, isBefore, isSameMonth, isSameWeek } from "date-fns"
import { es } from "date-fns/locale"

// IMPORTAMOS EL MODAL QUE CREAMOS
import ModalAsignarClase from "@/components/admin/ModalAsignarClase"

export default function DetalleProfe() {
  const { id } = useParams()
  const supabase = createClient()
  
  const [profe, setProfe] = useState<any>(null)
  const [clasesAsignadas, setClasesAsignadas] = useState<any[]>([])
  const [todasLasClases, setTodasLasClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [resProfe, resAsignadas, resTodas] = await Promise.all([
        supabase.from("perfiles").select("*").eq("id", id).single(),
        supabase.from("clases")
          .select("*")
          .eq("profesor_id", id)
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
    const { error } = await supabase.from("clases").update({ profesor_id: id }).eq("id", claseId)
    if (error) return toast.error("Error al asignar")
    toast.success("Clase asignada correctamente")
    cargarDatos()
  }

  const marcarAusente = async (claseId: string, nivel: string, fechaStr: string) => {
    const fechaFormat = format(parseISO(fechaStr), "dd/MM")
    if (!window.confirm(`¿Marcar ausencia y liberar la clase de ${nivel.toUpperCase()} del ${fechaFormat}?\n\nEsta clase pasará a estar "Sin Profesora" y no se le sumará a la liquidación.`)) return

    const { error } = await supabase.from("clases").update({ profesor_id: null }).eq("id", claseId)
    if (error) return toast.error("Error al liberar clase")
    
    toast.info("Clase liberada", { description: "La clase vuelve a estar disponible para otras profesoras." })
    cargarDatos()
  }

  const hoy = new Date()
  const clasesRealizadas = clasesAsignadas.filter(c => isBefore(parseISO(c.fecha), hoy) && !isSameDay(parseISO(c.fecha), hoy))
  const totalMesActual = clasesRealizadas.filter(c => isSameMonth(parseISO(c.fecha), hoy)).length
  const totalSemanaActual = clasesRealizadas.filter(c => isSameWeek(parseISO(c.fecha), hoy, { weekStartsOn: 1 })).length

  const clasesAgrupadasPorMes = clasesAsignadas.reduce((acc: any, clase) => {
    const mesAnio = format(parseISO(clase.fecha), 'MMMM yyyy', { locale: es })
    if (!acc[mesAnio]) acc[mesAnio] = []
    acc[mesAnio].push(clase)
    return acc
  }, {})

  if (cargando) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-fuchsia-600 h-10 w-10" /></div>

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
              {profe?.nombre_completo?.charAt(0)}
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-none">{profe?.nombre_completo}</h2>
            <p className="text-fuchsia-600 text-[10px] font-black uppercase tracking-widest mt-2">Profesora Titular</p>
            
            <div className="mt-8 space-y-4 text-left bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <Mail className="h-4 w-4 text-slate-400" /> <span className="truncate">{profe?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <Phone className="h-4 w-4 text-slate-400" /> {profe?.telefono || "Sin teléfono"}
              </div>
              <div className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                <MapPin className="h-4 w-4 text-slate-400" /> {profe?.direccion || "Sin dirección"}
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

        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Clases Asignadas</h3>
              <p className="text-sm text-slate-500 font-medium">Historial y clases futuras</p>
            </div>
            <Button 
              onClick={() => setModalAbierto(true)} 
              className="bg-fuchsia-600 hover:bg-slate-900 text-white rounded-2xl h-12 px-6 font-black uppercase tracking-widest transition-all shadow-lg shadow-fuchsia-900/20 w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" /> Asignar Clase
            </Button>
          </div>

          <div className="space-y-8">
            {Object.keys(clasesAgrupadasPorMes).length === 0 ? (
              <div className="p-16 border-2 border-dashed border-slate-200 rounded-[3rem] text-center text-slate-400 bg-white">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-bold uppercase tracking-widest text-xs">Sin clases registradas</p>
              </div>
            ) : (
              Object.entries(clasesAgrupadasPorMes).map(([mes, clasesDelMes]: [string, any]) => (
                <div key={mes} className="space-y-4">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest px-4 border-b border-slate-200 pb-2 capitalize">
                    {mes}
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {clasesDelMes.map((clase: any) => {
                      const esPasada = isBefore(parseISO(clase.fecha), hoy) && !isSameDay(parseISO(clase.fecha), hoy);
                      const esHoy = isSameDay(parseISO(clase.fecha), hoy);

                      return (
                        <div key={clase.id} className="p-5 bg-white border border-slate-200 rounded-[2rem] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow group">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl text-center min-w-[4rem] ${esPasada ? 'bg-emerald-50 text-emerald-600' : esHoy ? 'bg-fuchsia-50 text-fuchsia-600' : 'bg-slate-100 text-slate-500'}`}>
                              <p className="text-[10px] font-black uppercase leading-none mb-1">{format(parseISO(clase.fecha), 'EEE', { locale: es })}</p>
                              <p className="text-lg font-black leading-none">{format(parseISO(clase.fecha), 'dd')}</p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 uppercase text-lg leading-tight tracking-tight">{clase.nivel}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {clase.horario.slice(0,5)} hs
                                </p>
                                {esPasada && <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">Dictada</span>}
                                {esHoy && <span className="text-[9px] font-black text-fuchsia-500 uppercase bg-fuchsia-50 px-2 py-0.5 rounded-full">Hoy</span>}
                              </div>
                            </div>
                          </div>
                          
                          {!esPasada && (
                            <Button 
                              onClick={() => marcarAusente(clase.id, clase.nivel, clase.fecha)} 
                              variant="ghost" 
                              className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl font-bold text-xs h-10 transition-colors self-end sm:self-auto opacity-100 md:opacity-0 md:group-hover:opacity-100"
                            >
                              <UserMinus className="h-4 w-4 mr-2" /> Ausente / Liberar
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AQUÍ LLAMAMOS A NUESTRO COMPONENTE SEPARADO */}
      <ModalAsignarClase 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)} 
        clasesLibres={todasLasClases} 
        onAsignar={asignarClase} 
      />

    </div>
  )
}