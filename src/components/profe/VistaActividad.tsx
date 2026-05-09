import { useState } from "react"
import { format, parseISO, isSameDay, isBefore, isAfter, isSameMonth, subMonths, addMonths, isSameWeek } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, ArrowRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VistaActividad({ clases, hoy }: { clases: any[], hoy: Date }) {
  const [mesFiltro, setMesFiltro] = useState(new Date())

  const clasesDelMes = clases.filter(c => isSameMonth(parseISO(c.fecha), mesFiltro))
  const realizadas = clasesDelMes.filter(c => isBefore(parseISO(c.fecha), hoy) && !isSameDay(parseISO(c.fecha), hoy))
  const paraHoyActividad = clasesDelMes.filter(c => isSameDay(parseISO(c.fecha), hoy))
  const futuras = clasesDelMes.filter(c => isAfter(parseISO(c.fecha), hoy) && !isSameDay(parseISO(c.fecha), hoy))

  // LÓGICA DE PAGO: Solo se cuentan las clases donde NO se marcó ausencia
  const realizadasAcreditadas = realizadas.filter(c => !c.profesor_ausente_id)

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Mi Actividad</h1>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => setMesFiltro(subMonths(mesFiltro, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-4 py-2 text-xs font-black uppercase text-slate-700 w-32 text-center">{format(mesFiltro, 'MMMM yyyy', { locale: es })}</span>
          <Button variant="ghost" size="icon" onClick={() => setMesFiltro(addMonths(mesFiltro, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </header>

      {/* TABLERO DE LIQUIDACIÓN */}
      <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-xl flex justify-around items-center border border-slate-800">
        <div className="text-center">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Total Mes
          </p>
          <p className="text-6xl font-black leading-none mt-2">{realizadasAcreditadas.length}</p>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 italic">Ya dictadas</p>
        </div>
        <div className="w-px h-20 bg-white/10"></div>
        <div className="text-center">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" /> Esta Semana
          </p>
          <p className="text-6xl font-black leading-none mt-2">
            {realizadasAcreditadas.filter(c => isSameWeek(parseISO(c.fecha), hoy, { weekStartsOn: 1 })).length}
          </p>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 italic">Lunes a Domingo</p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Clases Realizadas ({realizadas.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {realizadas.map(c => {
            const esAusente = !!c.profesor_ausente_id;
            return (
              <div key={c.id} className={`border p-5 rounded-[2rem] flex justify-between items-center ${esAusente ? 'bg-red-50/30 border-red-100' : 'bg-emerald-50/30 border-emerald-100'}`}>
                <div>
                  <p className={`text-[10px] font-bold uppercase ${esAusente ? 'text-red-500' : 'text-emerald-600'}`}>{format(parseISO(c.fecha), 'EEE dd/MM', { locale: es })}</p>
                  <p className={`font-bold uppercase text-xs leading-none mt-1 ${esAusente ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{c.nivel}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black leading-none ${esAusente ? 'text-red-400 line-through' : 'text-slate-900'}`}>{c.horario.slice(0,5)}</p>
                  {esAusente ? (
                    <span className="text-[9px] font-black text-red-500 uppercase italic flex items-center justify-end gap-1 mt-1"><AlertCircle className="h-3 w-3" /> Ausente</span>
                  ) : (
                    <span className="text-[9px] font-black text-emerald-500 uppercase italic mt-1 block">Acreditada</span>
                  )}
                </div>
              </div>
            )
          })}
          {realizadas.length === 0 && <p className="text-slate-400 text-xs italic py-2 ml-2">Sin registro previo.</p>}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-black text-fuchsia-600 uppercase tracking-widest flex items-center gap-2 px-2">
          <Clock className="h-4 w-4" /> Para Hoy ({paraHoyActividad.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paraHoyActividad.map(c => {
            const esAusente = !!c.profesor_ausente_id;
            return (
              <div key={c.id} className={`bg-white border-2 p-6 rounded-[2.5rem] shadow-lg flex justify-between items-center relative overflow-hidden ${esAusente ? 'border-red-300 shadow-red-50' : 'border-fuchsia-500 shadow-fuchsia-100'}`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${esAusente ? 'bg-red-500' : 'bg-fuchsia-500'}`}></div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-tighter ${esAusente ? 'text-red-500' : 'text-fuchsia-500'}`}>
                    {esAusente ? 'Marcada como ausente' : 'Pendiente de acreditación'}
                  </p>
                  <p className={`font-black uppercase text-lg ${esAusente ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{c.nivel}</p>
                </div>
                <div className={`text-right text-xl font-black leading-none ${esAusente ? 'text-red-400 line-through' : 'text-slate-900'}`}>{c.horario.slice(0,5)} hs</div>
              </div>
            )
          })}
          {paraHoyActividad.length === 0 && <p className="text-slate-400 text-xs italic py-2 ml-2">No hay clases hoy.</p>}
        </div>
      </section>

      <section className="space-y-4 opacity-70 pt-4 border-t border-slate-200">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
          <ArrowRight className="h-4 w-4 text-slate-300" /> Próximas Clases ({futuras.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {futuras.sort((a,b) => parseISO(a.fecha).getTime() - parseISO(b.fecha).getTime()).map(c => {
            const esAusente = !!c.profesor_ausente_id;
            return (
              <div key={c.id} className={`bg-white border p-5 rounded-[2rem] flex justify-between items-center ${esAusente ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
                <div>
                  <p className={`text-[10px] font-bold uppercase ${esAusente ? 'text-red-400' : 'text-slate-400'}`}>{format(parseISO(c.fecha), 'EEE dd/MM', { locale: es })}</p>
                  <p className={`font-bold uppercase text-xs leading-none mt-1 ${esAusente ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{c.nivel}</p>
                </div>
                <div className="text-right">
                   <div className={`text-xs font-black ${esAusente ? 'text-red-400 line-through' : 'text-slate-500'}`}>{c.horario.slice(0,5)} hs</div>
                   {esAusente && <span className="text-[9px] font-black text-red-500 uppercase mt-1 block">Liberada</span>}
                </div>
              </div>
            )
          })}
          {futuras.length === 0 && <p className="text-slate-400 text-xs italic py-2 ml-2">No quedan clases programadas.</p>}
        </div>
      </section>
    </div>
  )
}