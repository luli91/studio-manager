import { CreditCard, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VistaPagos({ misPagos }: { misPagos: any[] }) {
  
  const formatearFechaHermosa = (fechaString: string) => {
    if(!fechaString) return ""
    const fechaLimpia = fechaString.split('T')[0].split(' ')[0]
    const [año, mes, dia] = fechaLimpia.split('-')
    return `${dia}/${mes}/${año}`
  }

  return (
    <Card className="border-border shadow-sm animate-in fade-in bg-card">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-xl text-foreground">Historial de compras</CardTitle>
        <CardDescription className="text-muted-foreground">Revisá tus recibos y los packs que compraste.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {misPagos.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No hay pagos registrados todavía.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {misPagos.map((pago) => {
              const esEvento = pago.concepto && pago.concepto.includes("Evento");

              return (
                <div key={pago.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-background shadow-sm hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`${esEvento ? 'bg-secondary text-primary' : 'bg-muted text-foreground'} p-3 rounded-full border border-border`}>
                      {esEvento ? <Sparkles className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {pago.concepto ? pago.concepto : `Pack de ${pago.cantidad_clases || 0} clases`}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">{formatearFechaHermosa(pago.fecha)} • {pago.metodo_pago}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-foreground">${pago.monto}</p>
                    <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-md uppercase tracking-wider">Aprobado</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}