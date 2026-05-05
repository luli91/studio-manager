import { useState } from "react"
import { X, Search, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format, parseISO } from "date-fns"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  clasesLibres: any[];
  onAsignar: (claseId: string) => void;
}

export default function ModalAsignarClase({ isOpen, onClose, clasesLibres, onAsignar }: ModalProps) {
  // El estado de los filtros ahora vive SOLO acá adentro
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>("todos")
  const [busquedaNivel, setBusquedaNivel] = useState("")

  if (!isOpen) return null

  // Filtramos las clases
  const clasesFiltradas = clasesLibres.filter(clase => {
    const coincideDia = diaSeleccionado === "todos" || clase.dia_semana.toLowerCase() === diaSeleccionado;
    const coincideNivel = clase.nivel.toLowerCase().includes(busquedaNivel.toLowerCase());
    return coincideDia && coincideNivel;
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera Modal */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Asignar Clase</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Clases disponibles</p>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filtros Modal */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Día</label>
              <select 
                className="w-full h-12 px-4 rounded-2xl border-slate-200 text-slate-700 text-sm focus:ring-2 focus:ring-fuchsia-500 bg-white font-medium"
                value={diaSeleccionado}
                onChange={(e) => setDiaSeleccionado(e.target.value)}
              >
                <option value="todos">Cualquier día</option>
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Ej: Pole Sport..."
                  className="pl-12 h-12 rounded-2xl border-slate-200 text-slate-700 font-medium"
                  value={busquedaNivel}
                  onChange={(e) => setBusquedaNivel(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lista Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {clasesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <AlertTriangle className="h-10 w-10 mx-auto opacity-50" />
              <p className="text-sm font-bold uppercase tracking-widest">No hay clases libres</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clasesFiltradas.map(clase => (
                <div key={clase.id} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl flex justify-between items-center hover:border-fuchsia-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-white text-slate-600 p-2 px-3 rounded-xl font-black text-[10px] uppercase shadow-sm border border-slate-100 text-center min-w-[3.5rem]">
                       <span className="block text-fuchsia-500">{clase.dia_semana.slice(0,3)}</span>
                       <span>{format(parseISO(clase.fecha), 'dd/MM')}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm uppercase leading-tight tracking-tight">{clase.nivel}</p>
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
                    className="bg-slate-900 hover:bg-fuchsia-600 text-white rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest transition-all"
                  >
                    Asignar
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