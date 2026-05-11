"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { X, UserPlus, Trash2, Loader2, Search, Settings2, Save, Users, Clock, FileText, DollarSign, Sparkles, ListFilter, ReceiptText, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

const obtenerDiaSemana = (fechaString: string) => {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const [year, month, day] = fechaString.split('-');
  const fecha = new Date(Number(year), Number(month) - 1, Number(day));
  return dias[fecha.getDay()];
};

export default function GestionarClaseModal({ clase, onClose, onUpdate }: { clase: any, onClose: () => void, onUpdate: () => void }) {
  const supabase = createClient()
  const [cargando, setCargando] = useState(true)
  const [reservas, setReservas] = useState<any[]>([])
  const [alumnas, setAlumnas] = useState<any[]>([])
  const [profesoras, setProfesoras] = useState<any[]>([])
  
  // CRONOGRAMA Y REGLAS DINÁMICAS
  const [cronogramaFull, setCronogramaFull] = useState<any>({})
  const [wppEstudio, setWppEstudio] = useState("5491112345678")

  const [formaDePago, setFormaDePago] = useState<"creditos" | "pesos">(clase.costo_creditos === 0 ? "pesos" : "creditos")
  const [datosClase, setDatosClase] = useState({
    nivel: clase.nivel, horario: clase.horario, cupo_maximo: clase.cupo_maximo,
    profesor_id: clase.profesor_id || "", es_evento: clase.es_evento || false,
    precio: clase.precio || 0, descripcion: clase.descripcion || ""
  })
  const [guardandoCambios, setGuardandoCambios] = useState(false)

  const [alumnaSeleccionada, setAlumnaSeleccionada] = useState("")
  const [descontarCredito, setDescontarCredito] = useState(true)
  const [agregando, setAgregando] = useState(false)
  const [busquedaAlumna, setBusquedaAlumna] = useState("")

  const [reservaAEliminar, setReservaAEliminar] = useState<any | null>(null)
  const [pasoEliminacion, setPasoEliminacion] = useState<1 | 2>(1)
  const [eliminando, setEliminando] = useState(false)
  const [confirmarCobro, setConfirmarCobro] = useState(false)

  const diaDeLaSemana = clase.fecha ? obtenerDiaSemana(clase.fecha) : "";
  const opcionesDelDia = cronogramaFull[diaDeLaSemana] || [];
  const esEventoPago = datosClase.es_evento && formaDePago === "pesos" && datosClase.precio > 0;

  useEffect(() => { 
    const cargarDatos = async () => {
      setCargando(true)
      const [resReservas, resAlumnas, resProfes, resConfig] = await Promise.all([
        supabase.from("reservas").select("id, estado, fecha_clase, perfiles(id, nombre_completo, nombre, apellido, email, telefono)").eq("clase_id", clase.id).eq("estado", "confirmada"),
        supabase.from("perfiles").select("id, nombre_completo, email, telefono, creditos_clases").eq("rol", "alumna").order("nombre_completo"),
        supabase.from("perfiles").select("id, nombre_completo").eq("rol", "profe").order("nombre_completo"),
        supabase.from("configuracion").select("*")
      ])
      
      if (resReservas.data) setReservas(resReservas.data)
      if (resAlumnas.data) setAlumnas(resAlumnas.data)
      if (resProfes.data) setProfesoras(resProfes.data)
      
      if (resConfig.data) {
        const c = resConfig.data.find(x => x.key === 'cronograma')?.valor
        const r = resConfig.data.find(x => x.key === 'reglas')?.valor
        if (c) setCronogramaFull(c)
        if (r?.whatsapp_estudio) setWppEstudio(r.whatsapp_estudio)
      }
      setCargando(false)
    }
    cargarDatos() 
  }, [clase.id, supabase])

  const handleGuardarCambiosClase = async () => {
    if (datosClase.es_evento) {
      if (!datosClase.nivel) return toast.error("Por favor, escribí el nombre del evento especial.");
      if (!datosClase.horario) return toast.error("Por favor, poné a qué hora arranca el evento.");
      if (formaDePago === "pesos" && datosClase.precio <= 0) return toast.error("Si el evento se cobra aparte, ingresá el precio de la entrada.");
    } else {
      if (!datosClase.nivel || !datosClase.horario) {
        return toast.error("Por favor, elegí una clase del listado oficial.");
      }
    }

    setGuardandoCambios(true)
    try {
      const payload = {
        nivel: datosClase.nivel,
        horario: datosClase.horario,
        cupo_maximo: datosClase.cupo_maximo,
        profesor_id: datosClase.profesor_id || null,
        es_evento: datosClase.es_evento,
        descripcion: datosClase.es_evento ? datosClase.descripcion : null,
        precio: (datosClase.es_evento && formaDePago === "pesos") ? datosClase.precio : null,
        costo_creditos: (datosClase.es_evento && formaDePago === "pesos") ? 0 : 1,
        grupo_id: datosClase.es_evento ? null : clase.grupo_id 
      }

      const { error } = await supabase.from("clases").update(payload).eq("id", clase.id)
      
      if (error) throw error
      toast.success("¡La clase se actualizó perfecto!")
      onUpdate()
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message)
    } finally {
      setGuardandoCambios(false)
    }
  }

  const procesarAnotacion = async (enviarWpp: boolean = false) => {
    if (!alumnaSeleccionada) return toast.error("Seleccioná una alumna")
    
    const alumna = alumnas.find(a => a.id === alumnaSeleccionada)
    if (!esEventoPago && descontarCredito && alumna?.creditos_clases <= 0) {
      return toast.error(`${alumna.nombre_completo} no tiene clases disponibles. No podés anotarla descontando crédito.`);
    }

    setAgregando(true)
    try {
      const { error: errorReserva } = await supabase.from("reservas").upsert({ 
        perfil_id: alumnaSeleccionada, clase_id: clase.id, estado: "confirmada", fecha_clase: clase.fecha
      }, { onConflict: 'perfil_id,clase_id,fecha_clase' })
      
      if (errorReserva) throw errorReserva

      if (esEventoPago) {
        const { error: errPago } = await supabase.from("pagos").insert([{
          perfil_id: alumnaSeleccionada, monto: datosClase.precio, cantidad_clases: 0, 
          fecha: new Date().toISOString(), concepto: `Entrada Evento: ${datosClase.nivel}`, metodo_pago: "Efectivo" 
        }])
        
        if (errPago) toast.error("Error al guardar en finanzas: " + errPago.message);
        else toast.success("¡Cobro sumado a Finanzas y alumna anotada!");

        if (enviarWpp && alumna?.telefono) {
          const numLimpio = alumna.telefono.replace(/\D/g, '')
          const [anio, mes, dia] = clase.fecha.split('-')
          const fechaArg = `${dia}/${mes}/${anio}`
          const msj = `¡Hola ${alumna.nombre_completo}! Tu pago de $${datosClase.precio} ingresó perfecto ✅\n\nQuedás confirmada para el evento *${datosClase.nivel}* del día ${fechaArg} a las ${datosClase.horario.slice(0,5)}hs.\n\n¡Te esperamos en el estudio! 💃`
          window.open(`https://wa.me/${numLimpio}?text=${encodeURIComponent(msj)}`, '_blank')
        }
      } else {
        if (descontarCredito && alumna) {
          await supabase.from("perfiles").update({ creditos_clases: (alumna.creditos_clases || 0) - 1 }).eq("id", alumna.id)
        }
        toast.success("Alumna agregada a la clase")
      }

      setAlumnaSeleccionada(""); setBusquedaAlumna(""); setConfirmarCobro(false);
      onUpdate(); onClose();
    } catch (error: any) { 
      toast.error(error.message) 
    } finally { 
      setAgregando(false) 
    }
  }

  const confirmarEliminacion = async (devolverClase: boolean) => {
    if (!reservaAEliminar) return
    setEliminando(true)
    try {
      await supabase.from("reservas").update({ estado: 'cancelada' }).eq("id", reservaAEliminar.id)
      
      if (esEventoPago) {
        const { error: errDev } = await supabase.from("pagos").insert([{
          perfil_id: reservaAEliminar.perfiles.id, monto: -datosClase.precio, cantidad_clases: 0,
          fecha: new Date().toISOString(), concepto: `Devolución Evento: ${datosClase.nivel}`, metodo_pago: "Efectivo"
        }])
        
        if (errDev) toast.error("Error en Finanzas: " + errDev.message);
        else toast.success(`Baja exitosa. Se restaron $${datosClase.precio} de Finanzas.`)

      } else if (devolverClase) {
        const { data: perfilActual } = await supabase.from("perfiles").select("creditos_clases").eq("id", reservaAEliminar.perfiles.id).single()
        await supabase.from("perfiles").update({ creditos_clases: (perfilActual?.creditos_clases || 0) + 1 }).eq("id", reservaAEliminar.perfiles.id)
        toast.success("Cupo liberado y clase devuelta")
      } else {
        toast.success("Cupo liberado (sin devolución)")
      }

      onUpdate(); onClose();
    } catch (error: any) { toast.error(error.message) } finally { setEliminando(false); setReservaAEliminar(null) }
  }

  const alumnasFiltradas = alumnas
    .filter(a => !reservas.some(r => r.perfiles?.id === a.id))
    .filter(a => a.nombre_completo?.toLowerCase().includes(busquedaAlumna.toLowerCase()))

  const alumnaObj = alumnas.find(a => a.id === alumnaSeleccionada);
  const sinSaldoParaGastar = !esEventoPago && descontarCredito && alumnaObj && alumnaObj.creditos_clases <= 0;

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-card rounded-3xl shadow-xl border border-border max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col">
          
          <div className="bg-primary p-6 flex justify-between items-center text-primary-foreground shrink-0">
            <h3 className="font-black text-2xl uppercase tracking-tighter italic">Gestionar Clase</h3>
            <button onClick={onClose} className="hover:bg-background/20 p-2 rounded-full transition-colors"><X className="h-6 w-6" /></button>
          </div>

          <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {cargando ? <div className="col-span-2 flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div> : (
              <>
                <div className="space-y-6">
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border space-y-4">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Settings2 className="h-4 w-4"/> Configuración de la clase</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {!datosClase.es_evento ? (
                        <div className="space-y-1 col-span-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1 flex items-center gap-1"><ListFilter className="h-3 w-3 text-primary"/> Clase Oficial ({diaDeLaSemana})</Label>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
                            value={datosClase.nivel && datosClase.horario ? `${datosClase.nivel}|${datosClase.horario}` : ""}
                            onChange={e => {
                              const [n, h] = e.target.value.split('|');
                              setDatosClase({...datosClase, nivel: n, horario: h});
                            }}
                          >
                            <option value="" disabled>Seleccioná del listado...</option>
                            {opcionesDelDia.map((opc: any) => (
                              <option key={`${opc.nivel}-${opc.hora}`} value={`${opc.nivel}|${opc.hora}`}>
                                {opc.hora} hs - {opc.nivel}
                              </option>
                            ))}
                          </select>
                          {opcionesDelDia.length === 0 && <p className="text-[10px] text-destructive mt-1 ml-1 font-bold">No hay clases oficiales este día.</p>}
                        </div>
                      ) : (
                        <>
                          <div className="space-y-1 col-span-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Nombre Evento</Label>
                            <Input value={datosClase.nivel} onChange={e => setDatosClase({...datosClase, nivel: e.target.value})} className="bg-background h-10 border-input focus-visible:ring-ring" placeholder="Workshop..." />
                          </div>
                          <div className="space-y-1 col-span-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Horario</Label>
                            <Input type="time" value={datosClase.horario} onChange={e => setDatosClase({...datosClase, horario: e.target.value})} className="bg-background h-10 border-input focus-visible:ring-ring" />
                          </div>
                        </>
                      )}

                      <div className="space-y-1 col-span-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Cupo Máx.</Label>
                        <Input type="number" min="1" value={datosClase.cupo_maximo} onChange={e => setDatosClase({...datosClase, cupo_maximo: parseInt(e.target.value) || 1})} className="bg-background h-10 border-input focus-visible:ring-ring" />
                      </div>
                      <div className="space-y-1 col-span-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Profesora</Label>
                        <select className="w-full h-10 px-3 rounded-md border border-input text-sm bg-background outline-none focus:border-ring focus:ring-1 focus:ring-ring" value={datosClase.profesor_id} onChange={e => setDatosClase({...datosClase, profesor_id: e.target.value})}>
                          <option value="">Sin profesora</option>
                          {profesoras.map(p => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="font-bold text-sm text-foreground flex items-center gap-1"><Sparkles className="h-4 w-4"/> ¿Es un evento especial?</Label>
                        <Switch 
                          checked={datosClase.es_evento} 
                          onCheckedChange={c => setDatosClase({...datosClase, es_evento: c, nivel: c ? "" : "", horario: c ? "" : ""})} 
                        />
                      </div>
                      
                      {datosClase.es_evento && (
                        <div className="space-y-3 animate-in fade-in bg-secondary/30 p-4 rounded-xl border border-border">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Descripción (opcional)</Label>
                            <Input placeholder="Requisitos, elementos..." value={datosClase.descripcion} onChange={e => setDatosClase({...datosClase, descripcion: e.target.value})} className="bg-background h-10 text-sm border-input focus-visible:ring-ring" />
                          </div>
                          
                          <div className="pt-2">
                            <Label className="text-xs font-bold text-foreground mb-2 block">Método de cobro del evento:</Label>
                            <div className="grid grid-cols-2 gap-3">
                              <button type="button" onClick={() => setFormaDePago("creditos")} className={`p-2 text-xs font-bold rounded-xl border-2 transition-all ${formaDePago === "creditos" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-background text-muted-foreground border-border hover:border-muted-foreground/30"}`}>Gasta clase</button>
                              <button type="button" onClick={() => setFormaDePago("pesos")} className={`p-2 text-xs font-bold rounded-xl border-2 transition-all ${formaDePago === "pesos" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-background text-muted-foreground border-border hover:border-muted-foreground/30"}`}>Se paga aparte</button>
                            </div>
                          </div>

                          {formaDePago === "pesos" && (
                            <div className="space-y-1 pt-2 animate-in fade-in">
                              <Label className="flex items-center gap-1 text-[10px] font-bold uppercase"><DollarSign className="h-3 w-3 text-primary"/> Precio de la entrada</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                                <Input type="number" min="0" placeholder="Ej: 15000" className="pl-7 bg-background h-10 text-sm border-input focus-visible:ring-ring" value={datosClase.precio} onChange={e => setDatosClase({...datosClase, precio: parseInt(e.target.value) || 0})} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button onClick={handleGuardarCambiosClase} disabled={guardandoCambios} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors h-12 rounded-xl font-bold">
                      {guardandoCambios ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />} Guardar cambios
                    </Button>
                  </div>

                  <div className={`p-5 rounded-2xl border space-y-4 ${esEventoPago ? 'bg-secondary/50 border-primary shadow-inner' : 'bg-muted/20 border-border'}`}>
                    <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${esEventoPago ? 'text-primary' : 'text-foreground'}`}>
                      <UserPlus className="h-4 w-4"/> {esEventoPago ? "Anotar y Cobrar Evento" : "Anotar Alumna"}
                    </h4>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar por nombre..." className="pl-9 bg-background h-10 border-input focus-visible:ring-ring" value={busquedaAlumna} onChange={e => setBusquedaAlumna(e.target.value)} />
                    </div>
                    
                    {busquedaAlumna && (
                      <div className="max-h-36 overflow-y-auto bg-background border border-border rounded-lg shadow-inner">
                        {alumnasFiltradas.length > 0 ? (
                          alumnasFiltradas.map(a => (
                            <div 
                              key={a.id} 
                              onClick={() => { 
                                setAlumnaSeleccionada(a.id); 
                                setBusquedaAlumna(""); 
                              }} 
                              className="p-3 text-sm cursor-pointer hover:bg-accent border-b border-border last:border-0 flex justify-between items-center"
                            >
                              <span className="font-medium text-foreground">{a.nombre_completo}</span>
                              <span className={`text-xs font-bold ${a.creditos_clases <= 0 ? 'text-destructive' : 'text-primary'}`}>
                                ({a.creditos_clases} clases)
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground text-center">No se encontraron alumnas.</div>
                        )}
                      </div>
                    )}

                    {alumnaSeleccionada && (
                      <div className="bg-background p-3 rounded-xl border border-border flex justify-between items-center shadow-sm animate-in fade-in">
                        <span className="font-bold text-sm text-foreground flex items-center gap-2">
                           <CheckCircle className="h-4 w-4 text-primary" />
                           {alumnas.find(a => a.id === alumnaSeleccionada)?.nombre_completo}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => setAlumnaSeleccionada("")}>
                          <X className="h-4 w-4"/>
                        </Button>
                      </div>
                    )}

                    {esEventoPago ? (
                      <div className="pt-2">
                        <Button onClick={() => setConfirmarCobro(true)} disabled={!alumnaSeleccionada} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl shadow-md">
                          Anotar Alumna
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center justify-between gap-4">
                          <label className="text-xs font-bold flex items-center gap-2 cursor-pointer text-foreground">
                            <input type="checkbox" checked={descontarCredito} onChange={e => setDescontarCredito(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" /> 
                            Descontar clase del pack
                          </label>
                          <Button onClick={() => procesarAnotacion(false)} disabled={agregando || !alumnaSeleccionada || sinSaldoParaGastar} className={`h-10 px-6 rounded-xl font-bold ${sinSaldoParaGastar ? 'bg-muted text-muted-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
                            Anotar
                          </Button>
                        </div>
                        {sinSaldoParaGastar && (
                          <p className="text-[10px] font-bold text-destructive text-right animate-in fade-in">Esta alumna no tiene clases en su cuenta.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end px-2">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Users className="h-4 w-4"/> Lista de Asistencia</h4>
                    <span className="text-xl font-black text-foreground italic">{reservas.length} / {datosClase.cupo_maximo}</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl divide-y overflow-hidden shadow-sm">
                    {reservas.length === 0 ? <div className="p-10 text-center text-muted-foreground text-sm italic">Nadie anotado todavía.</div> : 
                      reservas.map(res => (
                        <div key={res.id} className="p-4 flex justify-between items-center hover:bg-accent transition-colors">
                          <div>
                            <p className="font-bold text-foreground text-sm">{res.perfiles?.nombre ? `${res.perfiles.nombre} ${res.perfiles.apellido}` : res.perfiles?.nombre_completo}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{res.perfiles?.email}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => {setReservaAEliminar(res); setPasoEliminacion(1)}} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {confirmarCobro && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center space-y-5 border border-primary">
            <div className="mx-auto w-16 h-16 bg-secondary text-primary rounded-full flex items-center justify-center mb-2 shadow-inner">
              <ReceiptText className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-foreground tracking-tighter">¿Confirmar Anotación?</h3>
              <p className="text-muted-foreground text-sm mt-2 font-medium leading-relaxed">
                Al aceptar, se sumarán <strong>${datosClase.precio}</strong> a la caja de este mes.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => procesarAnotacion(true)} disabled={agregando} className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-12">
                {agregando ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Anotar y avisar por WhatsApp
              </Button>
              <Button onClick={() => procesarAnotacion(false)} disabled={agregando} variant="outline" className="w-full rounded-xl font-bold border-border text-foreground hover:bg-accent h-12">
                Solo anotar (sin mensaje)
              </Button>
              <Button onClick={() => setConfirmarCobro(false)} disabled={agregando} variant="ghost" className="w-full rounded-xl font-bold text-muted-foreground hover:bg-accent h-12">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {reservaAEliminar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4 border border-border">
            {pasoEliminacion === 1 ? (
              <>
                <h3 className="font-bold text-xl italic tracking-tighter uppercase text-foreground">¿Quitar de la clase?</h3>
                <p className="text-muted-foreground text-sm">Vas a liberar el cupo de <strong>{reservaAEliminar.perfiles?.nombre_completo}</strong>.</p>
                <Button onClick={() => setPasoEliminacion(2)} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold uppercase rounded-xl h-12">Continuar</Button>
                <Button onClick={() => setReservaAEliminar(null)} variant="ghost" className="w-full text-muted-foreground hover:text-foreground">Cancelar</Button>
              </>
            ) : (
              <>
                {esEventoPago ? (
                  <>
                    <h3 className="font-bold text-xl text-destructive italic tracking-tighter uppercase">¿Eliminar del Evento?</h3>
                    <p className="text-muted-foreground text-sm">Al aceptar, se le dará de baja y el sistema <strong>restará ${datosClase.precio} de tu caja actual.</strong></p>
                    <div className="space-y-2 mt-4">
                      <Button onClick={() => confirmarEliminacion(false)} disabled={eliminando} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold uppercase rounded-xl h-12">Confirmar baja y devolución</Button>
                      <Button onClick={() => setReservaAEliminar(null)} variant="outline" className="w-full border-border text-foreground hover:bg-accent font-bold uppercase rounded-xl h-12">Cancelar</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-xl italic tracking-tighter uppercase text-foreground">¿Devolver clase?</h3>
                    <p className="text-muted-foreground text-sm">¿Querés que recupere el crédito en su cuenta?</p>
                    <div className="space-y-2">
                      <Button onClick={() => confirmarEliminacion(true)} disabled={eliminando} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase rounded-xl h-12">Sí, devolver 1 clase</Button>
                      <Button onClick={() => confirmarEliminacion(false)} disabled={eliminando} variant="outline" className="w-full border-border text-foreground font-bold hover:bg-accent uppercase rounded-xl h-12">No, solo dar de baja</Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}