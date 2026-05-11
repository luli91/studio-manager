"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function CallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const procesarEntrada = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", user.id)
          .maybeSingle()

        if (!perfil) {
          router.push("/completar-perfil") 
        } else if (perfil.rol === "admin") {
          router.push("/admin")
        } else if (perfil.rol === "profe") {
          router.push("/profe")
        } else {
          router.push("/alumna")
        }
      } else {
        router.push("/login")
      }
    }

    procesarEntrada()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-semibold text-foreground">Preparando tu estudio...</h2>
    </div>
  )
}