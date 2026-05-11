"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { CreditCard, ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ResumenFinanzas from "@/components/admin/ResumenFinanzas"

export default function FinanzasAdmin() {
  const supabase = createClient()
  const [pagos, setPagos] = useState<any[]>([])

  useEffect(() => {
    const cargarPagos = async () => {
      const { data } = await supabase
        .from("pagos")
        .select(`
          *,
          perfiles (nombre_completo)
        `)
        .order("fecha", { ascending: false })
      
      if (data) setPagos(data)
    }
    cargarPagos()
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 bg-background min-h-screen text-foreground">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="hover:bg-secondary text-foreground"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Finanzas</h1>
        </div>
        <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-accent">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      <ResumenFinanzas />

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
          <h3 className="font-bold text-foreground">Últimos movimientos</h3>
        </div>
        <div className="divide-y divide-border">
          {pagos.map((pago) => (
            <div key={pago.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-secondary p-2 rounded-full">
                  <CreditCard className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{pago.perfiles?.nombre_completo || "Alumna eliminada"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(pago.fecha).toLocaleDateString('es-AR')} • Pack {pago.cantidad_clases} clases
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-foreground">${Number(pago.monto).toLocaleString('es-AR')}</p>
                <p className="text-[10px] font-bold text-primary uppercase">{pago.metodo_pago}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}