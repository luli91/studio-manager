"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { CreditCard, ArrowLeft, Download, DollarSign, Package, TrendingUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function FinanzasAdmin() {
  const supabase = createClient()
  const [pagos, setPagos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [metricas, setMetricas] = useState({ total: 0, cantidad: 0 })

  useEffect(() => {
    const cargarDatosFinancieros = async () => {
      const ahora = new Date()
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

      const { data, error } = await supabase
        .from("pagos")
        .select(`
          *,
          perfiles (nombre_completo)
        `)
        .order("fecha", { ascending: false })
      
      if (data) {
        setPagos(data)
        
        const pagosMes = data.filter(p => p.fecha >= inicioMes)
        const totalMes = pagosMes.reduce((sum, pago) => sum + Number(pago.monto), 0)
        
        setMetricas({
          total: totalMes,
          cantidad: pagosMes.filter(p => !p.concepto?.includes("Evento")).length
        })
      }
      setCargando(false)
    }

    cargarDatosFinancieros()
  }, [supabase])

  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString)
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Finanzas</h1>
            <p className="text-muted-foreground text-sm">Seguimiento de ingresos y devoluciones del estudio.</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-accent">
          <Download className="h-4 w-4" /> Exportar reporte
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary text-primary-foreground border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary-foreground/80">Caja del Mes</CardTitle>
            <DollarSign className="h-5 w-5 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">${metricas.total.toLocaleString('es-AR')}</div>
            <p className="text-primary-foreground/70 text-xs mt-4 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" /> Total acumulado (con devoluciones restadas)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Packs Vendidos</CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-foreground">{metricas.cantidad}</div>
            <p className="text-muted-foreground text-xs mt-4 font-medium">Packs de clases asignados este mes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm overflow-hidden bg-card">
        <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
          <h3 className="font-bold text-foreground">Historial detallado de ingresos</h3>
          <span className="text-xs font-bold text-muted-foreground uppercase">{pagos.length} registros totales</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground font-black border-b border-border">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Alumna</th>
                <th className="px-6 py-4">Concepto</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">No hay movimientos registrados.</td>
                </tr>
              ) : (
                pagos.map((pago) => {
                  const esDevolucion = Number(pago.monto) < 0;

                  return (
                    <tr key={pago.id} className="hover:bg-accent/50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-muted-foreground font-medium">{formatearFecha(pago.fecha)}</td>
                      <td className="px-6 py-4">
                        <p className={`font-bold ${esDevolucion ? 'text-muted-foreground' : 'text-foreground'}`}>{pago.perfiles?.nombre_completo || "Alumna eliminada"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                        {pago.concepto ? pago.concepto : `Pack de ${pago.cantidad_clases} clases`}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${esDevolucion ? 'bg-background text-muted-foreground border-border' : 'bg-secondary text-secondary-foreground border-border'}`}>
                          {pago.metodo_pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`font-black text-lg ${esDevolucion ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {esDevolucion ? '' : '+'} ${Number(pago.monto).toLocaleString('es-AR')}
                        </p>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}