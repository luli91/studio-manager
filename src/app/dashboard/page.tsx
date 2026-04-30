"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, CalendarDays, User as UserIcon, CreditCard, Sparkles, LogOut, ArrowRight, CheckCircle2, Pencil, X, Save } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DashboardAlumna() {
  const router = useRouter()
  const supabase = createClient()

  const [perfil, setPerfil] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [seccionActiva, setSeccionActiva] = useState("clases")

  // Nuevos estados para la edición
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo: "",
    telefono: "",
    contacto_urgencia: "",
    direccion: ""
  })

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      const { data } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (data) {
        setPerfil(data)
        // Cargamos los datos actuales en el formulario por si quiere editar
        setFormData({
          nombre_completo: data.nombre_completo || "",
          telefono: data.telefono || "",
          contacto_urgencia: data.contacto_urgencia || "",
          direccion: data.direccion || ""
        })
      }
      setCargando(false)
    }

    cargarPerfil()
  }, [router, supabase])

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Función para guardar los cambios en Supabase
  const handleGuardarCambios = async () => {
    setGuardando(true)
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({
          nombre_completo: formData.nombre_completo,
          telefono: formData.telefono,
          contacto_urgencia: formData.contacto_urgencia,
          direccion: formData.direccion
        })
        .eq("id", perfil.id)

      if (error) throw new Error("No pudimos actualizar tus datos.")

      // Si salió bien, actualizamos la vista y cerramos el modo edición
      setPerfil({ ...perfil, ...formData })
      setEditando(false)
      toast.success("¡Datos actualizados con éxito!")
      
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-fuchsia-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* MENÚ LATERAL */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            POLE<span className="text-fuchsia-600">KITTY</span>
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">¡Hola, {perfil?.nombre_completo?.split(' ')[0] || 'Alumna'}!</p>
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 flex-1">
          <Button variant={seccionActiva === "clases" ? "default" : "ghost"} className={`justify-start font-medium ${seccionActiva === "clases" ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`} onClick={() => setSeccionActiva("clases")}>
            <CalendarDays className="mr-3 h-5 w-5" /> Mis Clases
          </Button>

          <Button variant={seccionActiva === "perfil" ? "default" : "ghost"} className={`justify-start font-medium ${seccionActiva === "perfil" ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`} onClick={() => setSeccionActiva("perfil")}>
            <UserIcon className="mr-3 h-5 w-5" /> Mi Perfil
          </Button>

          <Button variant={seccionActiva === "pagos" ? "default" : "ghost"} className={`justify-start font-medium ${seccionActiva === "pagos" ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`} onClick={() => setSeccionActiva("pagos")}>
            <CreditCard className="mr-3 h-5 w-5" /> Mis Pagos
          </Button>

          <Button variant={seccionActiva === "eventos" ? "default" : "ghost"} className={`justify-start font-medium ${seccionActiva === "eventos" ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`} onClick={() => setSeccionActiva("eventos")}>
            <Sparkles className="mr-3 h-5 w-5" /> Eventos
          </Button>
        </nav>

        <div className="mt-auto pt-4 md:pt-8 border-t border-slate-100">
          <Button variant="ghost" onClick={handleCerrarSesion} className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="mr-3 h-5 w-5" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* HEADER DEL DASHBOARD */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Resumen de cuenta</h1>
              <p className="text-slate-500 text-sm">Gestioná tus reservas y tu información personal.</p>
            </div>
            <div className="flex items-center gap-3 bg-fuchsia-50 px-4 py-2 rounded-lg border border-fuchsia-100">
              <div className="bg-fuchsia-100 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-fuchsia-600" />
              </div>
              <div>
                <p className="text-xs text-fuchsia-600 font-semibold uppercase tracking-wider">Clases Disponibles</p>
                <p className="text-xl font-bold text-slate-900">{perfil?.creditos_clases || 0}</p>
              </div>
            </div>
          </div>

          {/* SECCIÓN: CLASES */}
          {seccionActiva === "clases" && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl text-slate-800">Próximas reservas</CardTitle>
                <CardDescription>No te olvides de cancelar con 24hs de anticipación.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-slate-50 rounded-xl p-10 text-center border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <CalendarDays className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-1">No tenés clases a la vista</h3>
                  <p className="text-slate-500 mb-6 text-sm max-w-sm">Tus próximas reservas aparecerán acá. ¡Anotate a una clase para empezar a entrenar!</p>
                  <Button className="bg-fuchsia-600 hover:bg-fuchsia-700 shadow-sm">
                    Ver grilla de horarios <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECCIÓN: PERFIL (¡AHORA EDITABLE!) */}
          {seccionActiva === "perfil" && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-slate-800">Ficha personal</CardTitle>
                  <CardDescription>Mantené tu información de contacto actualizada.</CardDescription>
                </div>
                {!editando && (
                  <Button variant="outline" size="sm" onClick={() => setEditando(true)} className="text-slate-600 border-slate-300 hover:bg-slate-50">
                    <Pencil className="h-4 w-4 mr-2" /> Editar datos
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                
                {!editando ? (
                  // VISTA DE SOLO LECTURA
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre completo</p>
                        <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-md border border-slate-100">{perfil?.nombre_completo}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email registrado</p>
                        <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-md border border-slate-100 text-slate-500">{perfil?.email} 🔒</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Personal</p>
                        <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-md border border-slate-100">{perfil?.telefono}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tel. Emergencia</p>
                        <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-md border border-slate-100">{perfil?.contacto_urgencia}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dirección</p>
                      <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-md border border-slate-100">{perfil?.direccion}</p>
                    </div>
                  </div>
                ) : (
                  // VISTA DE EDICIÓN
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="edit-nombre" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre completo</Label>
                        <Input id="edit-nombre" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} className="bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email (No editable)</Label>
                        <Input value={perfil?.email} disabled className="bg-slate-100 text-slate-500 cursor-not-allowed" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="edit-tel" className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Personal</Label>
                        <Input id="edit-tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-urgencia" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tel. Emergencia</Label>
                        <Input id="edit-urgencia" value={formData.contacto_urgencia} onChange={(e) => setFormData({...formData, contacto_urgencia: e.target.value})} className="bg-white" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-dir" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección</Label>
                      <Input id="edit-dir" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} className="bg-white" />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <Button onClick={handleGuardarCambios} disabled={guardando} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
                        {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar cambios
                      </Button>
                      <Button variant="ghost" onClick={() => setEditando(false)} disabled={guardando} className="text-slate-500 hover:text-slate-700">
                        <X className="mr-2 h-4 w-4" /> Cancelar
                      </Button>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          )}

          {/* SECCIÓN: PAGOS */}
          {seccionActiva === "pagos" && (
             <Card className="border-slate-200 shadow-sm">
             <CardHeader className="border-b border-slate-100 pb-4">
               <CardTitle className="text-xl text-slate-800">Historial de packs</CardTitle>
               <CardDescription>Revisá tus compras y comprobantes.</CardDescription>
             </CardHeader>
             <CardContent className="pt-6">
               <div className="text-center py-12">
                 <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                 <p className="text-slate-500 font-medium">No hay pagos registrados todavía.</p>
               </div>
             </CardContent>
           </Card>
          )}

          {/* SECCIÓN: EVENTOS */}
          {seccionActiva === "eventos" && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl text-slate-800">Eventos de la comunidad</CardTitle>
                <CardDescription>Seminarios especiales y encuentros.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Pronto anunciaremos nuevos eventos.</p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>

    </div>
  )
}