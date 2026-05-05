import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function VistaPerfil({ perfil, alActualizar }: { perfil: any, alActualizar: () => void }) {
  const supabase = createClient()
  const [datosEdit, setDatosEdit] = useState({ 
    nombre_completo: "", email: "", telefono: "", direccion: "", contacto_urgencia: "" 
  })

  // Carga los datos cuando el componente aparece
  useEffect(() => {
    if (perfil) {
      setDatosEdit({
        nombre_completo: perfil.nombre_completo || "",
        email: perfil.email || "",
        telefono: perfil.telefono || "",
        direccion: perfil.direccion || "",
        contacto_urgencia: perfil.contacto_urgencia || ""
      })
    }
  }, [perfil])

  const handleUpdatePerfil = async () => {
    const { error } = await supabase.from("perfiles").update(datosEdit).eq("id", perfil.id)
    if (error) return toast.error("Error al actualizar")
    toast.success("¡Perfil actualizado! ✨")
    alActualizar() // Llama a la función principal para recargar
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in pb-20">
      <header className="text-center">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Mi Perfil</h1>
        <p className="text-slate-500 font-medium">Actualizá tus datos personales.</p>
      </header>
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Nombre Completo</label>
            <Input value={datosEdit.nombre_completo} onChange={e => setDatosEdit({...datosEdit, nombre_completo: e.target.value})} className="rounded-2xl h-12" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">WhatsApp</label>
            <Input value={datosEdit.telefono} onChange={e => setDatosEdit({...datosEdit, telefono: e.target.value})} className="rounded-2xl h-12" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Dirección</label>
            <Input value={datosEdit.direccion} onChange={e => setDatosEdit({...datosEdit, direccion: e.target.value})} className="rounded-2xl h-12" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Contacto Emergencia</label>
            <Input value={datosEdit.contacto_urgencia} onChange={e => setDatosEdit({...datosEdit, contacto_urgencia: e.target.value})} className="rounded-2xl h-12" />
          </div>
        </div>
        <Button onClick={handleUpdatePerfil} className="w-full bg-slate-900 hover:bg-fuchsia-600 text-white h-14 rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all">
          <Save className="mr-2 h-5 w-5" /> Guardar Cambios
        </Button>
      </div>
    </div>
  )
}