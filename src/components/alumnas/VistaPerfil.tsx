import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Pencil, X, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function VistaPerfil({ perfil, alActualizar }: { perfil: any, alActualizar: () => void }) {
  const supabase = createClient()
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo: "", telefono: "", contacto_urgencia: "", direccion: ""
  })

  useEffect(() => {
    if (perfil) {
      setFormData({
        nombre_completo: perfil.nombre_completo || "",
        telefono: perfil.telefono || "",
        contacto_urgencia: perfil.contacto_urgencia || "",
        direccion: perfil.direccion || ""
      })
    }
  }, [perfil])

  const handleGuardarCambios = async () => {
    setGuardando(true)
    try {
      const { error } = await supabase.from("perfiles").update(formData).eq("id", perfil.id)
      if (error) throw new Error("No pudimos actualizar tus datos.")
      
      setEditando(false)
      toast.success("¡Datos actualizados con éxito!")
      alActualizar()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm animate-in fade-in">
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
          <div className="space-y-6 animate-in slide-in-from-top-2">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre completo</Label>
                <Input value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email (No editable)</Label>
                <Input value={perfil?.email} disabled className="bg-slate-100 text-slate-500 cursor-not-allowed" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Personal</Label>
                <Input value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tel. Emergencia</Label>
                <Input value={formData.contacto_urgencia} onChange={(e) => setFormData({...formData, contacto_urgencia: e.target.value})} className="bg-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección</Label>
              <Input value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} className="bg-white" />
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button onClick={handleGuardarCambios} disabled={guardando} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
                {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar cambios
              </Button>
              <Button variant="ghost" onClick={() => setEditando(false)} disabled={guardando} className="text-slate-500 hover:text-slate-700">
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}