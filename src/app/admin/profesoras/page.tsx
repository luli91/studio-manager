"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { GraduationCap, Phone, Mail, ChevronRight, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DirectorioProfes() {
  const supabase = createClient()
  const [profes, setProfes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarProfes = async () => {
      const { data } = await supabase
        .from("perfiles")
        .select("*")
        .eq("rol", "profe")
        .order("nombre_completo")
      if (data) setProfes(data)
      setCargando(false)
    }
    cargarProfes()
  }, [])

  if (cargando) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-fuchsia-600" /></div>

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Staff de Profesoras</h1>
        <p className="text-slate-500">Gestioná el equipo de trabajo del estudio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profes.map((profe) => (
          <Link key={profe.id} href={`/admin/profesoras/${profe.id}`}>
            <Card className="hover:border-fuchsia-300 transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600 font-bold text-xl">
                    {profe.nombre_completo.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{profe.nombre_completo}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {profe.telefono}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-fuchsia-500 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}