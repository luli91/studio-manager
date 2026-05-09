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
      // 1. Le preguntamos a Supabase quién acaba de llegar de Google
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // 2. Buscamos su ficha en la tabla perfiles
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", user.id)
          .maybeSingle()

        // 3. ¡La lógica de redirección!
        if (!perfil) {
          // Si no tiene perfil, es porque es NUEVA y entró con Google. 
          // ¡Acá la mandaremos al "Peaje" para pedirle el teléfono!
          router.push("/completar-perfil") 
        } else if (perfil.rol === "admin") {
          router.push("/admin")
        } else if (perfil.rol === "profe") {
          router.push("/profe")
        } else {
          router.push("/alumna")
        }
      } else {
        // Si hubo un error y no hay usuario, la mandamos a loguearse de nuevo
        router.push("/login")
      }
    }

    procesarEntrada()
  }, [router, supabase])

  // Esta es la pantallita de carga que verá la usuaria por 1 segundo al volver de Google
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <Loader2 className="h-12 w-12 animate-spin text-slate-900 mb-4" />
      <h2 className="text-xl font-semibold text-slate-700">Preparando tu estudio...</h2>
    </div>
  )
}