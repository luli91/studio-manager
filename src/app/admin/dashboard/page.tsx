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
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-primary p-6 rounded-xl shadow-sm border border-border">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">Panel de Administración</h1>
            <p className="text-primary-foreground/80">Control total del estudio, cupos y pagos.</p>
          </div>
          <Button variant="outline" onClick={handleCerrarSesion} className="bg-background text-foreground hover:bg-secondary border-none">
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  )
}