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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card w-full max-w-xl rounded-[3rem] shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-8 bg-primary text-primary-foreground flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Asignar Clase</h3>
            <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest mt-1">Clases sin profesora a cargo</p>
          </div>
          <button onClick={onClose} className="bg-background/10 p-2 rounded-full hover:bg-background/20 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-muted/30">
          {clasesLibres.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-3 bg-card rounded-3xl border border-dashed border-border">
              <AlertTriangle className="h-10 w-10 mx-auto opacity-50" />
              <p className="text-sm font-bold uppercase tracking-widest">No hay clases libres</p>
              <p className="text-xs">Todas las clases programadas ya tienen una profesora asignada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clasesLibres.map(clase => (
                <div key={clase.id} className="p-4 border border-border bg-card shadow-sm rounded-2xl flex justify-between items-center hover:border-primary transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 px-3 rounded-xl font-black text-[10px] uppercase shadow-sm border text-center min-w-[4rem] ${clase.es_evento ? 'bg-primary border-primary text-primary-foreground' : 'bg-secondary border-secondary text-secondary-foreground'}`}>
                       <span className={`block ${clase.es_evento ? 'text-primary-foreground/90' : 'text-primary'}`}>
                         {format(parseISO(clase.fecha), 'EEE', { locale: es })}
                       </span>
                       <span className="text-xs">{format(parseISO(clase.fecha), 'dd/MM')}</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm uppercase leading-tight tracking-tight flex items-center gap-1">
                        {clase.nivel}
                        {clase.es_evento && <Sparkles className="h-3 w-3 text-primary" />}
                      </p>
                      <p className="text-muted-foreground text-xs flex items-center gap-1 mt-1 font-bold">
                        <Clock className="h-3 w-3" /> {clase.horario.slice(0,5)} hs
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      onAsignar(clase.id);
                      onClose(); 
                    }} 
                    className="bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest transition-all shrink-0 ml-2"
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