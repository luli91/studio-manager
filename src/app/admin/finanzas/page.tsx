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
      // Obtenemos el inicio del mes actual para las métricas
      const ahora = new Date()
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

      // Traemos todos los pagos con el nombre de la alumna
      const { data, error } = await supabase
        .from("pagos")
        .select(`
          *,
          perfiles (nombre_completo)
        `)
        .order("fecha", { ascending: false })
      
      if (data) {
        setPagos(data)
        
        // Filtramos para las métricas del mes actual
        const pagosMes = data.filter(p => p.fecha >= inicioMes)
        const totalMes = pagosMes.reduce((sum, pago) => sum + Number(pago.monto), 0)
        
        setMetricas({
          total: totalMes,
          cantidad: pagosMes.length
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-fuchsia-600" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-200">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finanzas</h1>
            <p className="text-slate-500 text-sm">Seguimiento de ingresos y ventas del estudio.</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 border-slate-300">
          <Download className="h-4 w-4" /> Exportar reporte
        </Button>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-emerald-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80">Recaudación del Mes</CardTitle>
            <DollarSign className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">${metricas.total.toLocaleString('es-AR')}</div>
            <p className="text-emerald-100 text-xs mt-4 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" /> Total acumulado desde el día 1
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ventas Realizadas</CardTitle>
            <Package className="h-5 w-5 text-fuchsia-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900">{metricas.cantidad}</div>
            <p className="text-slate-500 text-xs mt-4 font-medium">Packs de clases asignados este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* TABLA DE ÚLTIMOS MOVIMIENTOS */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Historial detallado de ingresos</h3>
          <span className="text-xs font-bold text-slate-400 uppercase">{pagos.length} registros totales</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Alumna</th>
                <th className="px-6 py-4">Concepto</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No hay movimientos registrados.</td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{formatearFecha(pago.fecha)}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{pago.perfiles?.nombre_completo || "Alumna eliminada"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">Pack {pago.cantidad_clases} clases</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200">{pago.metodo_pago}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-black text-slate-900 text-lg">${Number(pago.monto).toLocaleString('es-AR')}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}