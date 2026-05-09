import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Phone, Mail, MapPin, AlertCircle, ChevronDown, ChevronUp, UserMinus } from "lucide-react"

export default function VistaDashboard({ perfil, clasesHoy }: { perfil: any, clasesHoy: any[] }) {
  const [alumnaExpandida, setAlumnaExpandida] = useState<string | null>(null)

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in pb-12">
      <header className="text-center">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
          ¡Hola, {perfil?.nombre || perfil?.nombre_completo?.split(' ')[0]}!
        </h1>
        <p className="text-slate-500 font-medium mt-2">
          Grilla y asistencia para hoy: {format(new Date(), "dd/MM/yyyy")}
        </p>
      </header>

      {clasesHoy.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center space-y-4">
          <CalendarIcon className="h-12 w-12 text-slate-100 mx-auto" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No tenés clases asignadas para hoy</p>
        </div>
      ) : (
        clasesHoy.map(clase => {
          // Separamos las reservas en confirmadas y canceladas
          const reservasConfirmadas = clase.reservas?.filter((r: any) => r.estado !== 'cancelada') || []
          const reservasCanceladas = clase.reservas?.filter((r: any) => r.estado === 'cancelada') || []

          return (
            <div key={clase.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <p className="text-fuchsia-400 text-[10px] font-black uppercase tracking-widest italic">Clase</p>
                  <h3 className="text-xl font-bold uppercase tracking-tighter">{clase.nivel}</h3>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-2xl font-black text-sm border border-white/5">{clase.horario.slice(0,5)} HS</div>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* 1. LISTADO DE ASISTENCIA */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3 italic flex justify-between items-center">
                    <span>Listado de asistencia ({reservasConfirmadas.length})</span>
                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full normal-case text-xs">
                      {reservasConfirmadas.length} / {clase.cupo_maximo} ocupados
                    </span>
                  </p>
                  
                  {reservasConfirmadas.length === 0 ? (
                    <p className="text-center text-slate-400 italic py-4 text-sm bg-slate-50 rounded-2xl border border-slate-100">Sin alumnas anotadas aún.</p>
                  ) : (
                    <div className="space-y-3">
                      {reservasConfirmadas.map((res: any, index: number) => (
                        <div key={res.id} className="border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm hover:border-slate-200 transition-all">
                          <button 
                            onClick={() => setAlumnaExpandida(alumnaExpandida === res.id ? null : res.id)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-black text-fuchsia-500 bg-white h-7 w-7 rounded-full flex items-center justify-center border shadow-sm shrink-0">
                                {index + 1}
                              </span>
                              <span className="font-bold text-slate-800 uppercase text-sm tracking-tight truncate">
                                {res.perfiles?.nombre ? `${res.perfiles.nombre} ${res.perfiles.apellido}` : res.perfiles?.nombre_completo || "Alumna"}
                              </span>
                            </div>
                            {alumnaExpandida === res.id ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                          </button>

                          {alumnaExpandida === res.id && (
                            <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Phone className="h-3 w-3" /> WhatsApp</p>
                                  <p className="font-bold text-slate-700 text-sm">{res.perfiles?.telefono || "No disponible"}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Mail className="h-3 w-3" /> Correo</p>
                                  <p className="font-bold text-slate-700 text-sm truncate">{res.perfiles?.email || "No disponible"}</p>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin className="h-3 w-3" /> Dirección</p>
                                  <p className="font-bold text-slate-700 text-sm uppercase">
                                    {res.perfiles?.calle ? `${res.perfiles.calle} ${res.perfiles.numero_calle}, ${res.perfiles.barrio_localidad}` : res.perfiles?.direccion || "Sin dirección"}
                                  </p>
                                </div>
                                <div className="space-y-1 md:col-span-2 mt-2 p-3 bg-fuchsia-50 rounded-2xl border border-fuchsia-100">
                                  <p className="text-[10px] font-black text-fuchsia-600 uppercase tracking-widest flex items-center gap-2"><AlertCircle className="h-3 w-3" /> Contacto de Emergencia</p>
                                  <p className="font-black text-slate-900 text-sm uppercase mt-1">{res.perfiles?.contacto_urgencia || "No cargado"}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. CUPOS LIBERADOS (CANCELACIONES) */}
                {reservasCanceladas.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-2 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Bajas de último momento ({reservasCanceladas.length})
                    </p>
                    <div className="space-y-2">
                      {reservasCanceladas.map((res: any) => (
                        <div key={res.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-2xl opacity-80">
                          <div className="p-2 bg-red-100 rounded-full shrink-0 text-red-500">
                            <UserMinus className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 uppercase">
                              {res.perfiles?.nombre ? `${res.perfiles.nombre} ${res.perfiles.apellido}` : res.perfiles?.nombre_completo || "Alumna"}
                            </p>
                            <p className="text-xs font-bold text-red-600">Liberó su lugar</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )
        })
      )}
    </div>
  )
}