"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Calendar as CalendarIcon, Clock, Users, FileText, DollarSign, Repeat, GraduationCap, Sparkles, Loader2, ListFilter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const CRONOGRAMA_OFICIAL: Record<string, {nivel: string, hora: string}[]> = {
  "Lunes": [{nivel: "Pole Sport", hora: "18:00"}, {nivel: "Pole Exotic", hora: "19:15"}],
  "Martes": [{nivel: "Funcional", hora: "10:30"}, {nivel: "Sensual Flow", hora: "17:45"}, {nivel: "Flex", hora: "19:00"}],
  "Miércoles": [{nivel: "Pole Exotic", hora: "17:45"}, {nivel: "Pole Sport", hora: "19:15"}],
  "Jueves": [{nivel: "Pole Basic", hora: "17:45"}, {nivel: "Pole Spin", hora: "19:00"}],
  "Viernes": [{nivel: "Funcional", hora: "10:30"}, {nivel: "Pole Exotic", hora: "17:45"}, {nivel: "Pole Sport", hora: "19:15"}, {nivel: "Pole Exotic", hora: "20:30"}],
  "Sábado": [{nivel: "Pole Mix", hora: "16:30"}],
  "Domingo": []
};

const obtenerDiaSemana = (fechaString: string) => {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const [year, month, day] = fechaString.split('-');
  const fecha = new Date(Number(year), Number(month) - 1, Number(day));
  return dias[fecha.getDay()];
};

export default function NuevaClaseForm({ onCertado }: { onCertado: () => void }) {
  const supabase = createClient()
  const [cargando, setCargando] = useState(false)
  const [profesoras, setProfesoras] = useState<any[]>([])
  const [repetir, setRepetir] = useState(false)
  const [mesesRepeticion, setMesesRepeticion] = useState(1)
  const [formaDePago, setFormaDePago] = useState<"creditos" | "pesos">("creditos")

  const [clase, setClase] = useState({
    fecha: "",
    horario: "",
    nivel: "",
    cupo_maximo: 10,
    es_evento: false,
    precio: 0,
    descripcion: "",
    profesor_id: ""
  })

  const diaDeLaSemana = clase.fecha ? obtenerDiaSemana(clase.fecha) : "";
  const opcionesDelDia = CRONOGRAMA_OFICIAL[diaDeLaSemana] || [];

  useEffect(() => {
    const cargarProfes = async () => {
      const { data } = await supabase.from("perfiles").select("id, nombre_completo").eq("rol", "profe").order("nombre_completo");
      if (data) setProfesoras(data);
    };
    cargarProfes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clase.es_evento && (!clase.nivel || !clase.horario)) return toast.error("Elegí una clase del listado");
    
    setCargando(true)
    try {
      const grupoId = repetir ? crypto.randomUUID() : null;
      const cantidadSemanas = repetir ? (mesesRepeticion * 4) : 1;
      const clasesAInsertar = [];
      let fechaActual = new Date(clase.fecha + "T00:00:00");

      for (let i = 0; i < cantidadSemanas; i++) {
        const year = fechaActual.getFullYear();
        const month = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const day = String(fechaActual.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        clasesAInsertar.push({
          nivel: clase.nivel,
          fecha: dateStr, 
          horario: clase.horario, 
          cupo_maximo: clase.cupo_maximo,
          es_evento: clase.es_evento,
          costo_creditos: (clase.es_evento && formaDePago === "pesos") ? 0 : 1,
          precio: (clase.es_evento && formaDePago === "pesos") ? clase.precio : null,
          descripcion: clase.es_evento ? clase.descripcion : null,
          dia_semana: obtenerDiaSemana(dateStr),
          grupo_id: grupoId,
          profesor_id: clase.profesor_id || null
        });
        fechaActual.setDate(fechaActual.getDate() + 7);
      }
      const { error } = await supabase.from("clases").insert(clasesAInsertar)
      if (error) throw error
      toast.success(repetir ? `¡Se crearon ${cantidadSemanas} clases con éxito! ✨` : "¡Calendario actualizado! ✨")
      onCertado() 
    } catch (error: any) { toast.error(error.message) } finally { setCargando(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground">Programar Clase</h2>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">Configurá la grilla del estudio</p>
      </div>

      <div className="p-4 bg-secondary/50 rounded-2xl border border-border flex items-center justify-between shadow-inner">
        <div className="space-y-0.5">
          <Label className="text-foreground font-bold flex items-center gap-2 leading-none cursor-pointer"><Sparkles className="h-4 w-4 text-primary"/> ¿Es un Evento Especial?</Label>
          <p className="text-[10px] text-muted-foreground font-medium">Workshops, clases libres o seminarios.</p>
        </div>
        <Switch 
          checked={clase.es_evento} 
          onCheckedChange={c => {
            setClase({...clase, es_evento: c, nivel: "", horario: ""});
          }} 
        />
      </div>

      <div className="space-y-4 bg-muted/30 p-5 rounded-2xl border border-border">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground ml-2"><CalendarIcon className="h-4 w-4 text-primary"/> 1. Elegí la fecha</Label>
          <Input type="date" required className="rounded-xl h-12 bg-background border-input focus-visible:ring-ring" value={clase.fecha} onChange={e => setClase({...clase, fecha: e.target.value, nivel: "", horario: ""})} />
        </div>

        {!clase.es_evento && clase.fecha && (
          <div className="space-y-2 animate-in fade-in">
            <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground ml-2"><ListFilter className="h-4 w-4 text-primary"/> 2. Clase de los {diaDeLaSemana}</Label>
            {opcionesDelDia.length > 0 ? (
              <select 
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 font-bold text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-all"
                value={clase.nivel && clase.horario ? `${clase.nivel}|${clase.horario}` : ""}
                onChange={e => {
                  const [n, h] = e.target.value.split('|');
                  setClase({...clase, nivel: n, horario: h});
                }}
              >
                <option value="" disabled>Seleccioná del listado...</option>
                {opcionesDelDia.map(opc => (
                  <option key={`${opc.nivel}-${opc.hora}`} value={`${opc.nivel}|${opc.hora}`}>
                    {opc.hora} hs - {opc.nivel}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-background rounded-xl border border-border text-muted-foreground text-sm italic text-center">
                No hay clases oficiales los {diaDeLaSemana}.
              </div>
            )}
          </div>
        )}
      </div>

      {clase.es_evento && (
        <div className="space-y-4 p-5 bg-secondary/30 border border-border rounded-2xl animate-in slide-in-from-right-2">
           <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Nombre</Label>
                <Input placeholder="Ej: Workshop..." required value={clase.nivel} onChange={e => setClase({...clase, nivel: e.target.value})} className="bg-background h-12 border-input focus-visible:ring-ring" />
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Horario</Label>
                <Input type="time" required value={clase.horario} onChange={e => setClase({...clase, horario: e.target.value})} className="bg-background h-12 border-input focus-visible:ring-ring" />
             </div>
           </div>
           <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Descripción (opcional)</Label>
              <Input placeholder="Requisitos, elementos..." value={clase.descripcion} onChange={e => setClase({...clase, descripcion: e.target.value})} className="bg-background h-12 border-input focus-visible:ring-ring" />
           </div>
           <div className="pt-2">
             <Label className="text-xs font-bold text-foreground mb-2 block">Método de cobro:</Label>
             <div className="grid grid-cols-2 gap-3">
               <button type="button" onClick={() => setFormaDePago("creditos")} className={`p-3 text-sm font-semibold rounded-xl border-2 transition-all ${formaDePago === "creditos" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-background text-muted-foreground border-border hover:border-muted-foreground/30"}`}>Descuenta clase</button>
               <button type="button" onClick={() => setFormaDePago("pesos")} className={`p-3 text-sm font-semibold rounded-xl border-2 transition-all ${formaDePago === "pesos" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-background text-muted-foreground border-border hover:border-muted-foreground/30"}`}>Se paga aparte</button>
             </div>
           </div>
           {formaDePago === "pesos" && (
             <div className="space-y-2 pt-2 animate-in fade-in">
               <Label className="flex items-center gap-2 text-[10px] font-bold uppercase"><DollarSign className="h-4 w-4 text-primary"/> Precio de la entrada</Label>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                 <Input type="number" min="0" className="pl-8 h-12 bg-background border-input focus-visible:ring-ring" placeholder="Ej: 15000" required value={clase.precio} onChange={e => setClase({...clase, precio: parseInt(e.target.value) || 0})} />
               </div>
             </div>
           )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-2">Cupo Máximo</Label>
          <Input type="number" min="1" value={clase.cupo_maximo} onChange={e => setClase({...clase, cupo_maximo: parseInt(e.target.value) || 1})} className="rounded-xl h-12 text-center font-bold text-lg bg-background border-input focus-visible:ring-ring" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-2 flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Profe</Label>
          <select className="w-full h-12 px-3 rounded-xl border border-input text-sm bg-background font-medium focus:ring-2 focus:ring-ring outline-none" value={clase.profesor_id} onChange={e => setClase({...clase, profesor_id: e.target.value})}>
            <option value="">Sin asignar</option>
            {profesoras.map(p => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4 bg-muted/30 rounded-2xl border border-border flex items-center justify-between shadow-inner">
        <Label className="font-bold flex items-center gap-2 cursor-pointer text-foreground"><Repeat className="h-5 w-5 text-primary"/> Repetir semanalmente</Label>
        <Switch checked={repetir} onCheckedChange={setRepetir} />
      </div>

      {repetir && (
        <div className="flex gap-2 animate-in slide-in-from-top-2">
          {[1, 2, 3, 6].map(m => (
            <button key={m} type="button" onClick={() => setMesesRepeticion(m)} className={`flex-1 h-12 rounded-xl text-xs font-bold transition-all border-2 ${mesesRepeticion === m ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-background text-muted-foreground border-border hover:border-muted-foreground/30'}`}>
              {m === 6 ? '1/2 Año' : `${m} Mes${m>1?'es':''}`}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCertado} className="rounded-2xl text-foreground font-bold uppercase tracking-widest text-xs h-14 px-8 border-border hover:bg-accent">Cancelar</Button>
        <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black uppercase tracking-tighter italic h-14 text-lg shadow-lg active:scale-95 transition-all" disabled={cargando}>
          {cargando ? <Loader2 className="animate-spin h-6 w-6" /> : "Crear en Calendario"}
        </Button>
      </div>
    </form>
  )
}