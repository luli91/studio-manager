"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Users, TrendingUp, MapPin, CalendarHeart, Flame, ArrowUpRight, DollarSign, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AdminDashboardMainPage() {
  const supabase = createClient()
  const [recaudacionMes, setRecaudacionMes] = useState(0)
  const [cargandoFinanzas, setCargandoFinanzas] = useState(true)

  // Cargamos la recaudación real para la tarjeta de finanzas
  useEffect(() => {
    const cargarRecaudacion = async () => {
      const ahora = new Date()
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

      const { data } = await supabase
        .from("pagos")
        .select("monto")
        .gte("fecha", inicioMes)

      if (data) {
        const total = data.reduce((sum, pago) => sum + Number(pago.monto), 0)
        setRecaudacionMes(total)
      }
      setCargandoFinanzas(false)
    }
    cargarRecaudacion()
  }, [supabase])

  return (
    <div className="space-y-8 animate-in fade-in">
      
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Resumen del Estudio</h1>
        <p className="text-slate-500 mt-1">Acá tenés un pantallazo de cómo viene tu negocio este mes.</p>
      </div>

      {/* MÉTRICAS PRINCIPALES: Las 4 tarjetas superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. TARJETA DE FINANZAS (Nueva) */}
        <Link href="/admin/finanzas" className="block transition-transform hover:scale-[1.02] active:scale-95">
          <Card className="border-none shadow-sm bg-emerald-600 text-white h-full">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Recaudación Mes</p>
                  {cargandoFinanzas ? (
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-200" />
                  ) : (
                    <p className="text-3xl font-black">${recaudacionMes.toLocaleString('es-AR')}</p>
                  )}
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-emerald-100 text-xs mt-4 flex items-center font-bold">
                Ver detalle de ingresos <ArrowUpRight className="h-3 w-3 ml-1" />
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* 2. ALUMNAS NUEVAS */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-fuchsia-600 to-fuchsia-800 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-fuchsia-100 text-sm font-medium uppercase tracking-wider">Alumnas Nuevas</p>
                <p className="text-4xl font-black">+14</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-fuchsia-100 text-sm mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" /> 20% más que el mes pasado
            </p>
          </CardContent>
        </Card>

        {/* 3. CLASE ESTRELLA */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Clase Estrella</p>
                <p className="text-2xl font-bold text-slate-900">Pole Sport</p>
                <p className="text-sm text-fuchsia-600 font-bold">Viernes 18:00hs</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-4">Con 95% de ocupación este mes.</p>
          </CardContent>
        </Card>

        {/* 4. PRÓXIMAS RESERVAS */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Próximas 48hs</p>
                <p className="text-2xl font-bold text-slate-900">32 Reservas</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-xl">
                <CalendarHeart className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-4">En 5 clases programadas.</p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS INFERIORES: Barrios y Ocupación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* GRÁFICO 1: Barrios */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-fuchsia-600" /> 
              Zonas de mayor afluencia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <p className="text-sm text-slate-500 mb-2">Basado en las direcciones registradas. Ideal para pensar tu próxima sucursal.</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-slate-700">
                <span>Palermo / Colegiales</span>
                <span>45%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-fuchsia-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-slate-700">
                <span>Belgrano</span>
                <span>30%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-fuchsia-500 h-2.5 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-slate-700">
                <span>Recoleta</span>
                <span>15%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-fuchsia-400 h-2.5 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO 2: Rendimiento de clases */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" /> 
              Clases más solicitadas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 mb-6">Cuáles son los niveles o disciplinas que más llenan el cupo.</p>
            
            <div className="space-y-4">
              {[
                { nombre: "Pole Sport (Principiantes)", ocupacion: 92 },
                { nombre: "Elongación y Flex", ocupacion: 78 },
                { nombre: "Pole Coreográfico", ocupacion: 65 },
                { nombre: "Pole Sport (Avanzadas)", ocupacion: 40 },
              ].map((clase, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{clase.nombre}</p>
                    <div className="w-48 bg-slate-200 rounded-full h-1.5 mt-2">
                      <div className={`h-1.5 rounded-full ${clase.ocupacion > 80 ? 'bg-emerald-500' : clase.ocupacion > 50 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${clase.ocupacion}%` }}></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold">Ocupación</p>
                    <p className="font-black text-slate-900">{clase.ocupacion}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}