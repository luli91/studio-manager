import { CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VistaPagos({ misPagos }: { misPagos: any[] }) {
  
  const formatearFechaHermosa = (fechaString: string) => {
    if(!fechaString) return ""
    const fechaLimpia = fechaString.split('T')[0].split(' ')[0]
    const [año, mes, dia] = fechaLimpia.split('-')
    return `${dia}/${mes}/${año}`
  }

  return (
    <Card className="border-slate-200 shadow-sm animate-in fade-in">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-xl text-slate-800">Historial de compras</CardTitle>
        <CardDescription>Revisá tus recibos y los packs que compraste.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {misPagos.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay pagos registrados todavía.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {misPagos.map((pago) => (
              <div key={pago.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-fuchsia-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-50 p-3 rounded-full text-emerald-600">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Pack de {pago.cantidad_clases} clases</p>
                    <p className="text-sm text-slate-500">{formatearFechaHermosa(pago.fecha)} • {pago.metodo_pago}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900">${pago.monto}</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-wider">Aprobado</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}