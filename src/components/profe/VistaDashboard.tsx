import { useState } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Phone, Mail, MapPin, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"

export default function VistaDashboard({ perfil, clasesHoy }: { perfil: any, clasesHoy: any[] }) {
  const [alumnaExpandida, setAlumnaExpandida] = useState<string | null>(null)

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
      <header className="text-center">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
          ¡Hola, {perfil?.nombre_completo?.split(' ')[0]}!
        </h1>
        <p className="text-slate-500 font-medium mt-2">
          Alumnas registradas para hoy: {format(new Date(), "dd/MM/yyyy")}
        </p>
      </header>

      {clasesHoy.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center space-y-4">
          <CalendarIcon className="h-12 w-12 text-slate-100 mx-auto" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No hay clases asignadas para hoy</p>
        </div>
      ) : (
        clasesHoy.map(clase => (
          <div key={clase.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <p className="text-fuchsia-400 text-[10px] font-black uppercase tracking-widest italic">Clase</p>
                <h3 className="text-xl font-bold uppercase tracking-tighter">{clase.nivel}</h3>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-2xl font-black text-sm border border-white/5">{clase.horario.slice(0,5)} HS</div>
            </div>
            
            <div className="p-6 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 italic">
                Listado de asistencia ({clase.reservas.length})
              </p>
              
              {clase.reservas.length === 0 ? (
                <p className="text-center text-slate-400 italic py-4 text-sm">Sin alumnas anotadas aún.</p>
              ) : (
                clase.reservas.map((res: any, index: number) => (
                  <div key={res.id} className="border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm hover:border-slate-200 transition-all">
                    <button 
                      onClick={() => setAlumnaExpandida(alumnaExpandida === res.id ? null : res.id)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-fuchsia-500 bg-white h-7 w-7 rounded-full flex items-center justify-center border shadow-sm">
                          {index + 1}
                        </span>
                        <span className="font-bold text-slate-800 uppercase text-sm tracking-tight">
                          {res.perfiles?.nombre_completo || "Alumna"}
                        </span>
                      </div>
                      {alumnaExpandida === res.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
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
                              {res.perfiles?.direccion || "Sin dirección"}
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
                ))
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}