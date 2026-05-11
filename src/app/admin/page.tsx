"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Users, TrendingUp, MapPin, CalendarHeart, Flame, ArrowUpRight, DollarSign, Loader2, UserMinus, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AdminDashboardMainPage() {
  const supabase = createClient()
  
  const [metricas, setMetricas] = useState({
    recaudacion: 0,
    alumnasNuevas: 0,
    totalAlumnas: 0,
    porcentajeCrecimiento: 0,
    reservasProximas: 0,
    claseEstrella: "Cargando...", 
    totalReservasEstrella: 0,     
    rankingDisciplinas: [] as { nombre: string, cantidad: number, porcentajeBarra: number }[],
    actividadReciente: [] as any[]
  })
  const [barrios, setBarrios] = useState<{nombre: string, porcentaje: number}[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarDashboard = async () => {
      const ahora = new Date()
      
      const año = ahora.getFullYear()
      const mesJS = ahora.getMonth()
      const dia = ahora.getDate()
      
      const mesStr = String(mesJS + 1).padStart(2, '0')
      const diaStr = String(dia).padStart(2, '0')
      const inicioMesActualString = `${año}-${mesStr}-01`
      
      const fechaInicioMes = new Date(año, mesJS, 1).getTime()
      const fechaInicioMesPasado = new Date(mesJS === 0 ? año - 1 : año, mesJS === 0 ? 11 : mesJS - 1, 1).getTime()
      
      const hoyLocalStr = `${año}-${mesStr}-${diaStr}`
      const pasadoMañana = new Date(ahora)
      pasadoMañana.setDate(dia + 2)
      const limite48hsStr = `${pasadoMañana.getFullYear()}-${String(pasadoMañana.getMonth() + 1).padStart(2, '0')}-${String(pasadoMañana.getDate()).padStart(2, '0')}`

      const [resPagos, resAlumnas, resReservasProx, resTodasReservas, resActividad] = await Promise.all([
        supabase.from("pagos").select("monto").gte("fecha", inicioMesActualString),
        supabase.from("perfiles").select("id, created_at, barrio_localidad").eq("rol", "alumna"),
        supabase.from("reservas").select("id").eq("estado", "confirmada").gte("fecha_clase", hoyLocalStr).lte("fecha_clase", limite48hsStr),
        supabase.from("reservas").select(`id, clases ( nivel )`).eq("estado", "confirmada"),
        supabase.from("reservas")
          .select("id, estado, fecha_clase, perfiles(nombre, apellido), clases(nivel, horario)")
          .eq("estado", "cancelada")
          .gte("fecha_clase", hoyLocalStr)
          .lte("fecha_clase", limite48hsStr)
          .order("fecha_clase", { ascending: true })
          .limit(8)
      ])
      
      const alumnas = resAlumnas.data || []
      const totalAlumnasCount = alumnas.length 
      
      let nuevasEsteMes = 0
      let nuevasMesPasado = 0
      
      alumnas.forEach(alumna => {
        if (!alumna.created_at) return 
        const fechaRegistro = new Date(alumna.created_at).getTime()
        if (fechaRegistro >= fechaInicioMes) {
          nuevasEsteMes++
        } else if (fechaRegistro >= fechaInicioMesPasado && fechaRegistro < fechaInicioMes) {
          nuevasMesPasado++
        }
      })
      
      let crecimiento = 0
      if (nuevasMesPasado === 0 && nuevasEsteMes > 0) {
        crecimiento = 100 
      } else if (nuevasMesPasado > 0) {
        crecimiento = Math.round(((nuevasEsteMes - nuevasMesPasado) / nuevasMesPasado) * 100)
      }

      const conteoBarrios: Record<string, number> = {}
      let alumnasConBarrio = 0

      alumnas.forEach(p => {
        const barrio = p.barrio_localidad ? p.barrio_localidad.trim() : ""
        if (barrio) {
          conteoBarrios[barrio] = (conteoBarrios[barrio] || 0) + 1
          alumnasConBarrio++
        }
      })

      const totalParaBarrios = alumnasConBarrio || 1 
      const barriosFormateados = Object.entries(conteoBarrios)
        .map(([nombre, cantidad]) => ({ nombre, porcentaje: Math.round((cantidad / totalParaBarrios) * 100) }))
        .sort((a, b) => b.porcentaje - a.porcentaje)
        .slice(0, 5)

      const conteoDisciplinas: Record<string, number> = {}
      resTodasReservas.data?.forEach((r: any) => {
        const nombre = r.clases?.nivel || "Sin nombre"
        conteoDisciplinas[nombre] = (conteoDisciplinas[nombre] || 0) + 1
      })

      const rankingOrdenado = Object.entries(conteoDisciplinas)
        .map(([nombre, cantidad]) => ({ 
          nombre, 
          cantidad,
          porcentajeBarra: Math.min(Math.round((cantidad / 15) * 100), 100)
        }))
        .sort((a, b) => b.cantidad - a.cantidad)

      const ganadora = rankingOrdenado[0]

      const totalRecaudado = resPagos.data?.reduce((sum, p) => sum + Number(p.monto), 0) || 0
      const reservasProximasCount = resReservasProx.data?.length || 0

      setMetricas({
        recaudacion: totalRecaudado,
        alumnasNuevas: nuevasEsteMes,
        totalAlumnas: totalAlumnasCount,
        porcentajeCrecimiento: crecimiento,
        reservasProximas: reservasProximasCount,
        claseEstrella: ganadora?.nombre || "Sin reservas",
        totalReservasEstrella: ganadora?.cantidad || 0,
        rankingDisciplinas: rankingOrdenado.slice(0, 5),
        actividadReciente: resActividad.data || []
      })
      setBarrios(barriosFormateados)
      setCargando(false)
    }

    cargarDashboard()
  }, [supabase])

  if (cargando) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resumen del Estudio</h1>
        <p className="text-muted-foreground mt-1">Datos reales extraídos de tu base de datos hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Link href="/admin/finanzas" className="block transition-transform hover:scale-[1.02]">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground h-full">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">Recaudación Mes</p>
                  <p className="text-3xl font-black">${metricas.recaudacion.toLocaleString('es-AR')}</p>
                </div>
                <div className="bg-background/10 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <p className="text-primary-foreground/70 text-xs mt-4 flex items-center font-bold">
                Ver detalle de ingresos <ArrowUpRight className="h-3 w-3 ml-1" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/alumnas" className="block transition-transform hover:scale-[1.02]">
          <Card className="border border-border shadow-sm bg-card text-foreground h-full">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Alumnas</p>
                    <p className="text-4xl font-black">{metricas.totalAlumnas}</p>
                  </div>
                  <div className="bg-secondary p-3 rounded-xl">
                    <Users className="h-6 w-6 text-secondary-foreground" />
                  </div>
                </div>
                
                <div className="mt-4 space-y-1">
                  <p className="text-foreground text-sm flex items-center font-bold">
                      +{metricas.alumnasNuevas} nuevas este mes
                  </p>
                  <p className="text-muted-foreground text-xs flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" /> 
                    {metricas.porcentajeCrecimiento >= 0 ? '+' : ''}{metricas.porcentajeCrecimiento}% vs mes pasado
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-xs mt-4 flex items-center font-bold border-t border-border pt-3">
                Ver directorio <ArrowUpRight className="h-3 w-3 ml-1" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="border border-border shadow-sm h-full bg-card">
          <CardContent className="p-6 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Más popular</p>
                <p className="text-2xl font-bold text-foreground">{metricas.claseEstrella}</p>
                <p className="text-sm text-primary font-bold">{metricas.totalReservasEstrella} reservas activas</p>
              </div>
              <div className="bg-secondary p-3 rounded-xl">
                <Flame className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-4 border-t border-border pt-3">Disciplina con más éxito.</p>
          </CardContent>
        </Card>

        <Link href="/admin/clases" className="block transition-transform hover:scale-[1.02]">
          <Card className="border border-border shadow-sm h-full bg-card">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Próximas 48hs</p>
                    <p className="text-2xl font-bold text-foreground">{metricas.reservasProximas} Reservas</p>
                  </div>
                  <div className="bg-secondary p-3 rounded-xl">
                    <CalendarHeart className="h-6 w-6 text-secondary-foreground" />
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-xs mt-4 flex items-center font-bold border-t border-border pt-3 hover:text-primary transition-colors">
                Ver reservas en la grilla <ArrowUpRight className="h-3 w-3 ml-1" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground" /> Cupos liberados (Próximas 48hs)
        </h3>
        <div className="bg-card rounded-xl border border-border shadow-sm p-2 divide-y divide-border">
          {metricas.actividadReciente.map((act) => (
            <div key={act.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/30 transition-colors">
              <div className="p-2 rounded-full mt-1 sm:mt-0 bg-secondary text-secondary-foreground shrink-0">
                <UserMinus className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium text-sm sm:text-base">
                  <strong>{act.perfiles?.nombre} {act.perfiles?.apellido}</strong> canceló su lugar en <strong>{act.clases?.nivel}</strong>
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> Clase del {act.fecha_clase.split('-').reverse().join('/')} a las {act.clases?.horario.slice(0,5)}hs
                </p>
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-auto">
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest bg-primary text-primary-foreground shadow-sm animate-pulse">
                  ¡Cupo Disponible!
                </span>
              </div>
            </div>
          ))}
          {metricas.actividadReciente.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <CalendarHeart className="h-8 w-8 mx-auto mb-3 text-muted" />
              No hubo cancelaciones para mañana ni pasado. <br/> ¡Todos los cupos están firmes!
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        <Card className="border border-border shadow-sm bg-card">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5 text-primary" /> 
              Zonas de mayor afluencia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <p className="text-sm text-muted-foreground mb-2">Distribución real según direcciones de alumnas.</p>
            
            {barrios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Aún no hay alumnas con zonas registradas.</div>
            ) : (
              barrios.map((barrio, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-foreground">
                    <span>{barrio.nombre}</span>
                    <span>{barrio.porcentaje}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-1000" 
                      style={{ width: `${barrio.porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm bg-card">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" /> 
              Clases más solicitadas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-6">Rendimiento real por disciplina.</p>
            
            <div className="space-y-4">
              {metricas.rankingDisciplinas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No hay reservas registradas aún.</div>
              ) : (
                metricas.rankingDisciplinas.map((clase, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-bold text-foreground text-sm">{clase.nombre}</p>
                      <div className="w-48 bg-secondary rounded-full h-1.5 mt-2">
                        <div 
                          className="h-1.5 rounded-full bg-primary" 
                          style={{ width: `${clase.porcentajeBarra}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Reservas</p>
                      <p className="font-black text-foreground">{clase.cantidad}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}