import { useState } from "react"
import { Clock, Sparkles, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import GrillaReservas from "@/components/alumnas/GrillaReservas"

export default function VistaClases({ 
  perfil, 
  misReservas, 
  onCancelar, 
  procesandoCancelacion, 
  onRecargar 
}: { 
  perfil: any, 
  misReservas: any[], 
  onCancelar: (reserva: any) => void, 
  procesandoCancelacion: string | null,
  onRecargar: () => void 
}) {

  const formatearFechaHermosa = (fechaString: string) => {
    if(!fechaString) return ""
    const fechaLimpia = fechaString.split('T')[0].split(' ')[0]
    const [año, mes, dia] = fechaLimpia.split('-')
    return `${dia}/${mes}`
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-xl text-foreground">Mis próximas reservas</CardTitle>
          <CardDescription className="text-muted-foreground">No te olvides de cancelar con 5hs de anticipación.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {misReservas.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
              Todavía no tenés reservas activas. ¡Anotate a una clase en la grilla de abajo!
            </div>
          ) : (
            <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {misReservas.map(reserva => {
                const esEvento = reserva.clases?.es_evento;

                return (
                  <div key={reserva.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl shadow-sm transition-colors gap-4 ${esEvento ? 'border-primary bg-secondary/30 hover:border-primary/80' : 'border-border bg-background hover:border-primary/50'}`}>
                    <div className="flex items-center gap-4">
                      
                      {/* CAJITA DE LA FECHA */}
                      <div className={`${esEvento ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} p-3 rounded-xl flex flex-col items-center justify-center min-w-[70px] border border-border`}>
                        <p className={`text-xs font-bold uppercase ${esEvento ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{reserva.clases?.dia_semana.slice(0,3)}</p>
                        <p className="text-lg font-black">{formatearFechaHermosa(reserva.fecha_clase)}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-foreground flex items-center gap-2">
                          {reserva.clases?.nivel}
                          {/* ETIQUETA DE EVENTO */}
                          {esEvento && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider ml-1 flex items-center gap-1"><Sparkles className="h-3 w-3"/> Evento</span>}
                        </h4>
                        <p className="text-sm flex items-center gap-1 mt-0.5 text-muted-foreground font-medium">
                          <Clock className="h-3 w-3" /> {reserva.clases?.horario.slice(0,5)} hs
                        </p>
                      </div>
                    </div>
                    
                    {/* BOTÓN CANCELAR */}
                    <Button 
                      variant="outline" 
                      onClick={() => onCancelar(reserva)}
                      disabled={procesandoCancelacion === reserva.id}
                      className="text-muted-foreground border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive w-full sm:w-auto transition-colors"
                    >
                      {procesandoCancelacion === reserva.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Cancelar reserva
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm overflow-hidden bg-card">
        <CardHeader className="border-b border-border pb-4 bg-background">
          <CardTitle className="text-xl text-foreground">Grilla de Horarios</CardTitle>
          <CardDescription className="text-muted-foreground">Elegí tu clase y asegurá tu lugar.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 bg-muted/30">
          <GrillaReservas perfil={perfil} onReservaExitosa={onRecargar} />
        </CardContent>
      </Card>
    </div>
  )
}