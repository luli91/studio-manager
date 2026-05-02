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
      // Obtenemos el primer y último día del mes actual
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

  if (cargando) return <Loader2 className="h-6 w-6 animate-spin text-slate-400" />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-emerald-50 border-emerald-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-emerald-700 uppercase">Recaudación del Mes</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-emerald-900">${metricas.total.toLocaleString('es-AR')}</div>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Basado en {metricas.cantidad} ventas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-fuchsia-50 border-fuchsia-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-fuchsia-700 uppercase">Packs Vendidos</CardTitle>
          <Package className="h-4 w-4 text-fuchsia-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-fuchsia-900">{metricas.cantidad}</div>
          <p className="text-xs text-fuchsia-600 mt-1">Este mes en total</p>
        </CardContent>
      </Card>
    </div>
  )
}