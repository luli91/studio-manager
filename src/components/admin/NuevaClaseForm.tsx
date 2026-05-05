"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Calendar as CalendarIcon, Clock, Users, FileText, DollarSign, Repeat, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const obtenerDiaSemana = (fechaString: string) => {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const fecha = new Date(fechaString + "T00:00:00"); 
  return dias[fecha.getDay()];
};

export default function NuevaClaseForm({ onCertado }: { onCertado: () => void }) {
  const supabase = createClient()
  const [cargando, setCargando] = useState(false)
  const [profesoras, setProfesoras] = useState<any[]>([])

  const [formaDePago, setFormaDePago] = useState<"creditos" | "pesos">("creditos")
  
  const [repetir, setRepetir] = useState(false)
  const [mesesRepeticion, setMesesRepeticion] = useState(1)

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
  
  useEffect(() => {
    const cargarProfes = async () => {
      const { data } = await supabase
        .from("perfiles")
        .select("id, nombre_completo")
        .eq("rol", "profe")
        .order("nombre_completo");
      if (data) setProfesoras(data);
    };
    cargarProfes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        const fechaFormateada = `${year}-${month}-${day}`;

        clasesAInsertar.push({
          nivel: clase.nivel,
          fecha: fechaFormateada, 
          horario: clase.horario, 
          cupo_maximo: clase.cupo_maximo,
          es_evento: clase.es_evento,
          costo_creditos: (clase.es_evento && formaDePago === "pesos") ? 0 : 1,
          precio: (clase.es_evento && formaDePago === "pesos") ? clase.precio : null,
          descripcion: clase.es_evento ? clase.descripcion : null,
          dia_semana: obtenerDiaSemana(fechaFormateada),
          grupo_id: grupoId,
          profesor_id: clase.profesor_id || null
        });

        fechaActual.setDate(fechaActual.getDate() + 7);
      }

      const { error } = await supabase.from("clases").insert(clasesAInsertar)

      if (error) throw error

      toast.success(repetir ? `¡Se crearon ${cantidadSemanas} clases con éxito! ✨` : "¡Clase creada con éxito! ✨")
      onCertado() 
    } catch (error: any) {
      toast.error("Error: " + error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 overflow-y-auto max-h-[85vh]">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-fuchsia-600"/> Fecha de Inicio</Label>
          <Input type="date" required value={clase.fecha} onChange={e => setClase({...clase, fecha: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Clock className="h-4 w-4 text-fuchsia-600"/> Horario</Label>
          <Input type="time" required value={clase.horario} onChange={e => setClase({...clase, horario: e.target.value})} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Nivel / Disciplina</Label>
          <Input placeholder="Ej: Pole Sport, Elongación..." required value={clase.nivel} onChange={e => setClase({...clase, nivel: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Users className="h-4 w-4 text-fuchsia-600"/> Cupo</Label>
          <Input type="number" min="1" required value={clase.cupo_maximo} onChange={e => setClase({...clase, cupo_maximo: parseInt(e.target.value) || 1})} />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-slate-900 font-bold">
          <GraduationCap className="h-4 w-4 text-fuchsia-600"/> Profesora que dictará la clase
        </Label>
        <select 
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-fuchsia-600 outline-none"
          value={clase.profesor_id}
          onChange={(e) => setClase({...clase, profesor_id: e.target.value})}
        >
          <option value="">Seleccionar profesora (opcional)</option>
          {profesoras.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre_completo}</option>
          ))}
        </select>
      </div>
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-slate-900 font-bold text-base flex items-center gap-2">
              <Repeat className="h-4 w-4 text-fuchsia-600"/> Repetir todas las semanas
            </Label>
            <p className="text-xs text-slate-500">Genera esta clase automáticamente en el calendario.</p>
          </div>
          <Switch 
            checked={repetir} 
            onCheckedChange={setRepetir}
          />
        </div>

        {repetir && (
          <div className="pt-3 border-t border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label>¿Por cuánto tiempo querés generarla?</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600"
              value={mesesRepeticion}
              onChange={(e) => setMesesRepeticion(Number(e.target.value))}
            >
              <option value={1}>Por 1 mes (4 clases)</option>
              <option value={2}>Por 2 meses (8 clases)</option>
              <option value={3}>Por 3 meses (12 clases)</option>
              <option value={6}>Por medio año (24 clases)</option>
            </select>
          </div>
        )}
      </div>

      <div className="p-4 bg-fuchsia-50/50 rounded-xl border border-fuchsia-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-fuchsia-900 font-bold text-base">¿Es un evento especial?</Label>
            <p className="text-xs text-fuchsia-600">Workshops, seminarios, clases de fotos, etc.</p>
          </div>
          <Switch checked={clase.es_evento} onCheckedChange={(checked: boolean) => setClase({...clase, es_evento: checked})} />
        </div>

        {clase.es_evento && (
          <div className="pt-3 border-t border-fuchsia-100 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><FileText className="h-4 w-4 text-fuchsia-600"/> Descripción (opcional)</Label>
              <Input placeholder="Ej: Traer rodilleras y tacos..." value={clase.descripcion} onChange={e => setClase({...clase, descripcion: e.target.value})} />
            </div>

            <div className="space-y-3">
              <Label>¿Cómo se paga este evento?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormaDePago("creditos")} className={`p-3 text-sm font-semibold rounded-lg border transition-all ${formaDePago === "creditos" ? "bg-fuchsia-600 text-white border-fuchsia-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-fuchsia-300"}`}>Gasta 1 Clase</button>
                <button type="button" onClick={() => setFormaDePago("pesos")} className={`p-3 text-sm font-semibold rounded-lg border transition-all ${formaDePago === "pesos" ? "bg-fuchsia-600 text-white border-fuchsia-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-fuchsia-300"}`}>Se cobra aparte</button>
              </div>
            </div>

            {formaDePago === "pesos" && (
              <div className="space-y-2 pt-2">
                <Label className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-600"/> Precio de la entrada</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <Input type="number" min="0" className="pl-8 border-emerald-200 focus-visible:ring-emerald-500" placeholder="Ej: 15000" required value={clase.precio} onChange={e => setClase({...clase, precio: parseInt(e.target.value) || 0})} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCertado} className="text-slate-500">Cancelar</Button>
        <Button type="submit" className="flex-1 bg-slate-900 text-white hover:bg-slate-800" disabled={cargando}>{cargando ? "Guardando..." : "Crear en Calendario"}</Button>
      </div>
    </form>
  )
}