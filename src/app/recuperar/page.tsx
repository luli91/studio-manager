"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RecuperarClavePage() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-clave`,
    })

    if (error) {
      toast.error(error.message || "Hubo un error al enviar el correo")
    } else {
      setEnviado(true)
      toast.success("¡Correo enviado!")
    }
    setCargando(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
            Recuperar contraseña
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Ingresá tu email y te enviaremos un enlace para crear una nueva clave.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {enviado ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-sm font-medium">
                Revisá tu bandeja de entrada (y la carpeta de Spam por las dudas). Te enviamos un link seguro para cambiar tu clave.
              </div>
              <Button asChild variant="outline" className="w-full border-border text-foreground hover:bg-accent">
                <Link href="/login">Volver al inicio de sesión</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRecuperar} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email registrado</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  className="bg-background border-input focus-visible:ring-ring"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>

              <Button type="submit" className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90" disabled={cargando}>
                {cargando ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </Button>

              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Volver atrás
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}