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
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-xl text-slate-800">Mis próximas reservas</CardTitle>
          <CardDescription>No te olvides de cancelar con 12hs de anticipación.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {misReservas.length === 0 ? (
            <div className="text-center p-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              Todavía no tenés reservas activas. ¡Anotate a una clase en la grilla de abajo!
            </div>
          ) : (
            <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {misReservas.map(reserva => (
                <div key={reserva.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-fuchsia-200 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-fuchsia-50 p-3 rounded-xl text-fuchsia-700 flex flex-col items-center justify-center min-w-[70px]">
                      <p className="text-xs font-bold uppercase">{reserva.clases?.dia_semana.slice(0,3)}</p>
                      <p className="text-lg font-black">{formatearFechaHermosa(reserva.fecha_clase)}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        {reserva.clases?.nivel}
                        {reserva.clases?.es_evento && <Sparkles className="h-3 w-3 text-amber-500" />}
                      </h4>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {reserva.clases?.horario.slice(0,5)} hs
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => onCancelar(reserva)}
                    disabled={procesandoCancelacion === reserva.id}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto transition-colors"
                  >
                    {procesandoCancelacion === reserva.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Cancelar reserva
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-fuchsia-100 pb-4 bg-fuchsia-50">
          <CardTitle className="text-xl text-fuchsia-900">Grilla de Horarios</CardTitle>
          <CardDescription className="text-fuchsia-700">Elegí tu clase y asegurá tu lugar en el caño.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 bg-slate-50">
          <GrillaReservas perfil={perfil} onReservaExitosa={onRecargar} />
        </CardContent>
      </Card>
    </div>
  )
}