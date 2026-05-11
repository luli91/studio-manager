"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Save, Loader2, Plus, Trash2, DollarSign, Clock, Settings, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

// Este array es la "fuente de la verdad" para el orden de los días.
const ORDEN_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function ConfigPage() {
  const supabase = createClient()
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  // ESTADOS DE CONFIGURACIÓN
  const [cronograma, setCronograma] = useState<any>({})
  const [precios, setPrecios] = useState<any>({})
  const [reglas, setReglas] = useState<any>({})

  useEffect(() => {
    const cargarConfig = async () => {
      const { data } = await supabase.from("configuracion").select("*")
      if (data) {
        const configMap: any = {}
        data.forEach(item => configMap[item.key] = item.valor)
        setCronograma(configMap.cronograma || {})
        setPrecios(configMap.precios_packs || {})
        setReglas(configMap.reglas || {})
      }
      setCargando(false)
    }
    cargarConfig()
  }, [])

  const handleSave = async (key: string, valor: any) => {
    setGuardando(true)
    const { error } = await supabase.from("configuracion").upsert({ key, valor })
    if (error) toast.error("Error al guardar")
    else toast.success(`¡Actualizado correctamente!`)
    setGuardando(false)
  }

  // Lógica para agregar/quitar clases del cronograma
  const agregarClaseCronograma = (dia: string) => {
    const nuevoCronograma = { ...cronograma }
    nuevoCronograma[dia] = [...(nuevoCronograma[dia] || []), { nivel: "", hora: "" }]
    setCronograma(nuevoCronograma)
  }

  const eliminarClaseCronograma = (dia: string, index: number) => {
    const nuevoCronograma = { ...cronograma }
    nuevoCronograma[dia] = nuevoCronograma[dia].filter((_: any, i: number) => i !== index)
    setCronograma(nuevoCronograma)
  }

  if (cargando) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>

  return (
    <div className="space-y-10 pb-20 animate-in fade-in text-foreground">
      <header>
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter italic">Configuración del Estudio</h1>
        <p className="text-muted-foreground mt-1">Controlá precios, horarios y reglas generales.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECCIÓN PRECIOS */}
        <Card className="border-border bg-card shadow-sm h-fit">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary"/> Precios de Packs</CardTitle>
            <CardDescription className="text-muted-foreground">Cambiá lo que cobrás por cada cantidad de clases.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {Object.keys(precios).sort((a,b) => Number(a)-Number(b)).map((cant) => (
              <div key={cant} className="flex items-center gap-4">
                <Label className="w-32 font-bold text-muted-foreground">{cant === "1" ? "Clase Suelta" : `Pack ${cant} clases`}</Label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                  <Input 
                    type="number" 
                    value={precios[cant]} 
                    onChange={e => setPrecios({...precios, [cant]: Number(e.target.value)})}
                    className="pl-7 bg-background border-input focus-visible:ring-ring"
                  />
                </div>
              </div>
            ))}
            <Button onClick={() => handleSave('precios_packs', precios)} disabled={guardando} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4 font-bold">
              {guardando ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Guardar Precios
            </Button>
          </CardContent>
        </Card>

        {/* SECCIÓN REGLAS Y CONTACTO */}
        <Card className="border-border bg-card shadow-sm h-fit">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/> Reglas y Contacto</CardTitle>
            <CardDescription className="text-muted-foreground">Parámetros automáticos del sistema.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground"><Clock className="h-3 w-3"/> Límite de cancelación (Horas)</Label>
              <Input type="number" value={reglas.horas_cancelacion} onChange={e => setReglas({...reglas, horas_cancelacion: Number(e.target.value)})} className="bg-background border-input" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground"><MessageCircle className="h-3 w-3"/> WhatsApp (con 549...)</Label>
              <Input value={reglas.whatsapp_estudio} onChange={e => setReglas({...reglas, whatsapp_estudio: e.target.value})} className="bg-background border-input" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">Alias para eventos</Label>
              <Input value={reglas.alias_pago} onChange={e => setReglas({...reglas, alias_pago: e.target.value})} className="bg-background border-input" />
            </div>
            <Button onClick={() => handleSave('reglas', reglas)} disabled={guardando} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              {guardando ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Guardar Reglas
            </Button>
          </CardContent>
        </Card>

        {/* SECCIÓN CRONOGRAMA (EL MÁS GRANDE) */}
        <Card className="border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="text-lg">Cronograma de Clases Semanales</CardTitle>
            <CardDescription className="text-muted-foreground">Opciones que aparecen al crear una clase.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* AQUÍ ESTÁ EL CAMBIO: Usamos ORDEN_DIAS para asegurar la secuencia correcta */}
            {ORDEN_DIAS.map((dia) => (
              <div key={dia} className="p-4 rounded-2xl border border-border bg-muted/30 space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <h3 className="font-black text-foreground uppercase tracking-wider text-sm">{dia}</h3>
                  <Button variant="ghost" size="sm" onClick={() => agregarClaseCronograma(dia)} className="h-7 px-2 text-xs text-primary hover:bg-primary/10">
                    <Plus className="h-3 w-3 mr-1"/> Agregar
                  </Button>
                </div>
                <div className="space-y-3">
                  {/* Validamos que el día exista en cronograma (puede estar vacío) */}
                  {cronograma[dia]?.map((clase: any, idx: number) => (
                    <div key={idx} className="flex items-end gap-2 group">
                      <div className="flex-1 space-y-1">
                        <Input 
                          placeholder="Disciplina" 
                          value={clase.nivel} 
                          className="h-8 text-xs bg-background border-input focus-visible:ring-ring"
                          onChange={e => {
                            const nuevo = {...cronograma}
                            nuevo[dia][idx].nivel = e.target.value
                            setCronograma(nuevo)
                          }}
                        />
                        <Input 
                          type="time" 
                          value={clase.hora} 
                          className="h-8 text-xs bg-background border-input focus-visible:ring-ring"
                          onChange={e => {
                            const nuevo = {...cronograma}
                            nuevo[dia][idx].hora = e.target.value
                            setCronograma(nuevo)
                          }}
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => eliminarClaseCronograma(dia, idx)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4"/>
                      </Button>
                    </div>
                  ))}
                  {/* Mensaje si no hay clases ese día */}
                  {(!cronograma[dia] || cronograma[dia].length === 0) && (
                    <p className="text-xs text-muted-foreground italic text-center py-2">Sin clases programadas.</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-6 border-t border-border bg-muted/10">
             <Button onClick={() => handleSave('cronograma', cronograma)} disabled={guardando} className="w-full lg:w-fit bg-primary text-primary-foreground hover:bg-primary/90 px-10 font-bold">
                {guardando ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Actualizar Cronograma
             </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}