"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, Clock, Users, Sparkles, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

// AHORA RECIBE LOS DATOS DE LA ALUMNA Y LA FUNCIÓN PARA ACTUALIZAR LA PANTALLA
export default function GrillaReservas({ perfil, onReservaExitosa }: { perfil: any, onReservaExitosa: () => void }) {
  const supabase = createClient()
  const [clases, setClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesandoId, setProcesandoId] = useState<string | null>(null) // Para que el botón gire mientras guarda

  const [mesActual, setMesActual] = useState(new Date())
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(new Date().toISOString().split('T')[0])

  const cargarClasesDisponibles = async () => {
    const hoy = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from("clases")
      .select(`
        *,
        reservas (id, perfil_id) 
      `)
      .gte("fecha", hoy)
      .order("fecha", { ascending: true })
      .order("horario", { ascending: true })

    if (data) {
      setClases(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarClasesDisponibles()
  }, [])

  // --- LÓGICA MÁGICA DE RESERVA ---
  const handleReservar = async (clase: any) => {
    if (!perfil) return
    setProcesandoId(clase.id)

    try {
      const costo = clase.costo_creditos ?? 1
      const anotadas = clase.reservas?.length || 0
      const lugaresDisponibles = clase.cupo_maximo - anotadas

      // 1. Validaciones
      if (lugaresDisponibles <= 0) throw new Error("La clase ya está llena.")
      if (perfil.creditos_clases < costo) throw new Error("No tenés suficientes clases en tu pack.")
      
      const yaAnotada = clase.reservas?.some((r: any) => r.perfil_id === perfil.id)
      if (yaAnotada) throw new Error("¡Ya estás anotada en esta clase!")

      // 2. Guardar la reserva en la base de datos
      const { error: errReserva } = await supabase.from('reservas').insert({
        perfil_id: perfil.id,
        clase_id: clase.id,
        fecha_clase: clase.fecha,
        estado: 'confirmada'
      })
      if (errReserva) throw errReserva

      // 3. Descontarle la clase de su billetera virtual
      const nuevosCreditos = perfil.creditos_clases - costo
      const { error: errPerfil } = await supabase.from('perfiles')
        .update({ creditos_clases: nuevosCreditos })
        .eq('id', perfil.id)
      if (errPerfil) throw errPerfil

      toast.success("¡Lugar asegurado con éxito! 🎉")
      
      // 4. Refrescamos todo para que la pantalla baile
      await cargarClasesDisponibles() // Actualiza los cupos locales
      onReservaExitosa() // Le avisa al Dashboard que actualice las reservas de arriba

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcesandoId(null)
    }
  }

  // Lógica del Calendario
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
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-fuchsia-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* EL CALENDARIO INTERACTIVO */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => cambiarMes(-1)} className="text-slate-500 hover:text-fuchsia-600 hover:bg-fuchsia-50">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="font-bold text-slate-900 text-lg">
            {nombresMeses[month]} {year}
          </h3>
          <Button variant="ghost" size="icon" onClick={() => cambiarMes(1)} className="text-slate-500 hover:text-fuchsia-600 hover:bg-fuchsia-50">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {diasSemana.map(dia => (
            <div key={dia} className="text-xs font-bold text-slate-400 uppercase">{dia}</div>
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
                  ${esSeleccionado ? 'bg-fuchsia-600 text-white shadow-md' : 'text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700'}
                  ${esHoy && !esSeleccionado ? 'border border-fuchsia-200 text-fuchsia-600' : ''}
                `}
              >
                {dia}
                {tieneClase && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${esSeleccionado ? 'bg-white' : 'bg-fuchsia-500'}`}></span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* LISTA DE CLASES */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-fuchsia-600" />
          Clases del {fechaSeleccionada.split('-').reverse().join('/')}
        </h4>

        {clasesDelDiaSeleccionado.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm">No hay clases programadas para este día.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {clasesDelDiaSeleccionado.map((clase: any) => {
              const anotadas = clase.reservas?.length || 0
              const lugaresDisponibles = clase.cupo_maximo - anotadas
              const estaLlena = lugaresDisponibles <= 0
              const yaAnotada = clase.reservas?.some((r: any) => r.perfil_id === perfil?.id)

              return (
                <div key={clase.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-fuchsia-200 transition-colors">
                  
                  <div className="flex gap-4 items-center">
                    <div className={`p-3 rounded-xl text-center min-w-[75px] shrink-0 ${clase.es_evento ? 'bg-amber-100 text-amber-700' : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100'}`}>
                      <Clock className="h-4 w-4 mx-auto mb-1 opacity-70" />
                      <p className="text-lg font-black">{clase.horario.slice(0,5)}</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                        {clase.nivel}
                        {clase.es_evento && <Sparkles className="h-4 w-4 text-amber-500" />}
                      </h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {clase.es_evento ? clase.descripcion || "Evento especial" : "Clase regular"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                    <div className="text-center sm:text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase">Lugares</p>
                      <p className={`text-sm font-bold flex items-center justify-center sm:justify-end gap-1 ${estaLlena ? 'text-red-500' : 'text-slate-700'}`}>
                        <Users className="h-4 w-4" /> {anotadas} / {clase.cupo_maximo}
                      </p>
                    </div>

                    {/* EL BOTÓN MÁGICO */}
                    <Button 
                      onClick={() => handleReservar(clase)}
                      disabled={estaLlena || yaAnotada || procesandoId === clase.id}
                      className={
                        yaAnotada ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                        estaLlena ? "bg-slate-100 text-slate-400" : 
                        "bg-slate-900 hover:bg-fuchsia-600 text-white shadow-sm transition-colors"
                      }
                    >
                      {procesandoId === clase.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                       yaAnotada ? "Ya estás anotada" :
                       estaLlena ? "Agotado" : "Anotarme"}
                    </Button>
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