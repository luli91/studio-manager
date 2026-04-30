"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function DashboardAdmin() {
  const router = useRouter()
  const supabase = createClient()

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen p-8 bg-slate-900"> {/* Fondo oscuro para diferenciar rápido que estás como admin */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
            <p className="text-slate-400">Control total del estudio, cupos y pagos.</p>
          </div>
          <Button variant="destructive" onClick={handleCerrarSesion}>
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  )
}