"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function DashboardAlumna() {
  const router = useRouter()
  const supabase = createClient()

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Panel de Alumna</h1>
            <p className="text-slate-500">Acá vas a poder ver y reservar tus clases.</p>
          </div>
          <Button variant="outline" onClick={handleCerrarSesion}>
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  )
}