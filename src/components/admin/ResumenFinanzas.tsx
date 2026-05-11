"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { DollarSign, TrendingUp, Package, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResumenFinanzas() {
  const supabase = createClient()
  const [metricas, setMetricas] = useState({ total: 0, cantidad: 0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      const ahora = new Date()
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

      const { data } = await supabase
        .from("pagos")
        .select("monto")
        .gte("fecha", inicioMes)

      if (data) {
        const totalMes = data.reduce((sum, pago) => sum + Number(pago.monto), 0)
        setMetricas({
          total: totalMes,
          cantidad: data.length
        })
      }
      setCargando(false)
    }
    cargarDatos()
  }, [])

  if (cargando) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-widest">Recaudación del Mes</CardTitle>
          <DollarSign className="h-5 w-5 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-foreground">${metricas.total.toLocaleString('es-AR')}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3 text-emerald-500" /> Basado en {metricas.cantidad} ventas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-widest">Packs Vendidos</CardTitle>
          <Package className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-foreground">{metricas.cantidad}</div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Este mes en total</p>
        </CardContent>
      </Card>
    </div>
  )
}