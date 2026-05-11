"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, Clock, Users, Sparkles, ChevronLeft, ChevronRight, Calendar as CalendarIcon, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export default function GrillaReservas({ perfil, onReservaExitosa }: { perfil: any, onReservaExitosa: () => void }) {
  const supabase = createClient()
  const [clases, setClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesandoId, setProcesandoId] = useState<string | null>(null)
  
  const [wppEstudio, setWppEstudio] = useState("5491112345678") // Wpp Dinámico

  const [mesActual, setMesActual] = useState(new Date())
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const cargarDatosInit = async () => {
      // Cargamos el Wpp
      const { data: config } = await supabase.from("configuracion").select("valor").eq("key", "reglas").single()
      if (config?.valor?.whatsapp_estudio) setWppEstudio(config.valor.whatsapp_estudio)

      // Cargamos la grilla
      const hoy = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from("clases")
        .select(`*, reservas (id, perfil_id, estado)`)
        .gte("fecha", hoy)
        .order("fecha", { ascending: true })
        .order("horario", { ascending: true })

      if (data) {
        setClases(data.map(clase => ({
          ...clase,
          reservas_confirmadas: clase.reservas?.filter((r: any) => r.estado === 'confirmada') || []
        })))
      }
      setCargando(false)
    }
    cargarDatosInit()
  }, [])

  const handleReservar = async (clase: any) => {
    if (!perfil) return
    setProcesandoId(clase.id)

    try {
      const costo = clase.costo_creditos ?? 1
      const anotadas = clase.reservas_confirmadas?.length || 0
      const lugaresDisponibles = clase.cupo_maximo - anotadas

      if (lugaresDisponibles <= 0) throw new Error("La clase ya está llena.")
      if (perfil.creditos_clases < costo) throw new Error("No tenés suficientes clases en tu pack.")
      
      const yaAnotada = clase.reservas_confirmadas?.some((r: any) => r.perfil_id === perfil.id)
      if (yaAnotada) throw new Error("¡Ya estás anotada en esta clase!")

      const { error: errReserva } = await supabase.from('reservas').upsert({
        perfil_id: perfil.id,
        clase_id: clase.id,
        fecha_clase: clase.fecha,
        estado: 'confirmada'
      }, { onConflict: 'perfil_id,clase_id,fecha_clase' })
      if (errReserva) throw errReserva

      const nuevosCreditos = perfil.creditos_clases - costo
      const { error: errPerfil } = await supabase.from('perfiles')
        .update({ creditos_clases: nuevosCreditos })
        .eq('id', perfil.id)
      if (errPerfil) throw errPerfil

      toast.success("¡Lugar asegurado con éxito! 🎉")
      
      // Recargamos silenciosamente
      const hoy = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from("clases").select(`*, reservas (id, perfil_id, estado)`).gte("fecha", hoy).order("fecha", { ascending: true }).order("horario", { ascending: true })
      if (data) {
        setClases(data.map(clase => ({...clase, reservas_confirmadas: clase.reservas?.filter((r: any) => r.estado === 'confirmada') || []})))
      }
      onReservaExitosa() 

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcesandoId(null)
    }
  }

  const cambiarMes = (offset: number) => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + offset, 1))
  }

  const year = mesActual.getFullYear()
  const month = mesActual.getMonth()
  const diasEnMes = new Date(year, month + 1, 0).getDate()
  const primerDiaDelMes = new Date(year, month, 1).getDay()

  const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const diasSemana = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]

  const paddingDias = Array.from({ length: primerDiaDelMes }, (_, i) => i)
  const diasDelMes = Array.from({ length: diasEnMes }, (_, i) => {
    const dia = i + 1
    const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return { dia, fechaStr }
  })

  const diaTieneClases = (fechaStr: string) => clases.some(c => c.fecha === fechaStr)
  const clasesDelDiaSeleccionado = clases.filter(c => c.fecha === fechaSeleccionada)

  if (cargando) {
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => cambiarMes(-1)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="font-bold text-foreground text-lg">
            {nombresMeses[month]} {year}
          </h3>
          <Button variant="ghost" size="icon" onClick={() => cambiarMes(1)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {diasSemana.map(dia => (
            <div key={dia} className="text-xs font-bold text-muted-foreground uppercase">{dia}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {paddingDias.map(p => <div key={`pad-${p}`} className="h-10"></div>)}
          
          {diasDelMes.map(({ dia, fechaStr }) => {
            const esSeleccionado = fechaStr === fechaSeleccionada
            const tieneClase = diaTieneClases(fechaStr)
            const esHoy = fechaStr === new Date().toISOString().split('T')[0]

            return (
              <button
                key={fechaStr}
                onClick={() => setFechaSeleccionada(fechaStr)}
                className={`
                  relative h-10 w-full rounded-lg flex items-center justify-center text-sm font-medium transition-all
                  ${esSeleccionado ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}
                  ${esHoy && !esSeleccionado ? 'border border-primary/30 text-primary' : ''}
                `}
              >
                {dia}
                {tieneClase && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${esSeleccionado ? 'bg-primary-foreground' : 'bg-primary'}`}></span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-foreground flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Clases del {fechaSeleccionada.split('-').reverse().join('/')}
        </h4>

        {clasesDelDiaSeleccionado.length === 0 ? (
          <div className="text-center p-8 bg-muted/30 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground text-sm">No hay clases programadas para este día.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {clasesDelDiaSeleccionado.map((clase: any) => {
              const anotadas = clase.reservas_confirmadas?.length || 0
              const lugaresDisponibles = clase.cupo_maximo - anotadas
              const estaLlena = lugaresDisponibles <= 0
              const yaAnotada = clase.reservas_confirmadas?.some((r: any) => r.perfil_id === perfil?.id)
              
              const esEventoPago = clase.es_evento && clase.costo_creditos === 0 && clase.precio > 0

              return (
                <div key={clase.id} className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                  
                  <div className="flex gap-4 items-center">
                    <div className={`p-3 rounded-xl text-center min-w-[75px] shrink-0 ${clase.es_evento ? 'bg-secondary border border-border text-foreground' : 'bg-muted border border-border text-foreground'}`}>
                      <Clock className="h-4 w-4 mx-auto mb-1 opacity-70" />
                      <p className="text-lg font-black">{clase.horario.slice(0,5)}</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground flex items-center gap-2 text-lg">
                        {clase.nivel}
                        {clase.es_evento && <Sparkles className="h-4 w-4 text-primary" />}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {esEventoPago ? `Evento Pago: $${clase.precio}` : clase.es_evento ? clase.descripcion || "Evento con crédito" : "Clase regular"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                    <div className="text-center sm:text-right">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Lugares</p>
                      <p className={`text-sm font-bold flex items-center justify-center sm:justify-end gap-1 ${estaLlena ? 'text-destructive' : 'text-foreground'}`}>
                        <Users className="h-4 w-4" /> {anotadas} / {clase.cupo_maximo}
                      </p>
                    </div>

                    {esEventoPago ? (
                      <Button 
                        onClick={() => {
                          const msj = `Hola Flor! Me gustaría anotarme al evento de ${clase.nivel} el día ${fechaSeleccionada.split('-').reverse().join('/')} a las ${clase.horario.slice(0,5)}hs. ¿Me pasás los datos para abonar los $${clase.precio}?`
                          window.open(`https://wa.me/${wppEstudio}?text=${encodeURIComponent(msj)}`, '_blank')
                        }}
                        disabled={estaLlena || yaAnotada}
                        className={
                          yaAnotada ? "bg-secondary text-foreground hover:bg-secondary/80" :
                          estaLlena ? "bg-muted text-muted-foreground" : 
                          "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors"
                        }
                      >
                        {yaAnotada ? "Ya estás anotada" : estaLlena ? "Agotado" : <><MessageCircle className="h-4 w-4 mr-2" /> Reservar ($)</>}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleReservar(clase)}
                        disabled={estaLlena || yaAnotada || procesandoId === clase.id}
                        className={
                          yaAnotada ? "bg-secondary text-foreground hover:bg-secondary/80" :
                          estaLlena ? "bg-muted text-muted-foreground" : 
                          "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors"
                        }
                      >
                        {procesandoId === clase.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                         yaAnotada ? "Ya estás anotada" :
                         estaLlena ? "Agotado" : "Anotarme"}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}