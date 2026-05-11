"use client"

import { X, AlertTriangle, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  clasesLibres: any[];
  onAsignar: (claseId: string) => void;
}

export default function ModalAsignarClase({ isOpen, onClose, clasesLibres, onAsignar }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera Modal */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Asignar Clase</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Clases sin profesora a cargo</p>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Lista Scrollable (Sin filtros, orden natural) */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
          {clasesLibres.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3 bg-white rounded-3xl border border-dashed border-slate-200">
              <AlertTriangle className="h-10 w-10 mx-auto opacity-50" />
              <p className="text-sm font-bold uppercase tracking-widest">No hay clases libres</p>
              <p className="text-xs">Todas las clases programadas ya tienen una profesora asignada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clasesLibres.map(clase => (
                <div key={clase.id} className="p-4 border border-slate-200 bg-white shadow-sm rounded-2xl flex justify-between items-center hover:border-fuchsia-300 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 px-3 rounded-xl font-black text-[10px] uppercase shadow-sm border text-center min-w-[4rem] ${clase.es_evento ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                       <span className={`block ${clase.es_evento ? 'text-amber-500' : 'text-fuchsia-500'}`}>
                         {/* Mostramos el día formateado de forma segura */}
                         {format(parseISO(clase.fecha), 'EEE', { locale: es })}
                       </span>
                       <span className="text-xs">{format(parseISO(clase.fecha), 'dd/MM')}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm uppercase leading-tight tracking-tight flex items-center gap-1">
                        {clase.nivel}
                        {clase.es_evento && <Sparkles className="h-3 w-3 text-amber-500" />}
                      </p>
                      <p className="text-slate-500 text-xs flex items-center gap-1 mt-1 font-bold">
                        <Clock className="h-3 w-3" /> {clase.horario.slice(0,5)} hs
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      onAsignar(clase.id);
                      onClose(); // Cerramos el modal automáticamente al asignar
                    }} 
                    className="bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest transition-all shrink-0 ml-2"
                  >
                    Tomar Clase
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}