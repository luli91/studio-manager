import { ImageIcon } from "lucide-react"

export default function MultimediaPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
      <div className="bg-fuchsia-100 p-4 rounded-full text-fuchsia-600">
        <ImageIcon className="h-12 w-12" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Gestor Multimedia</h1>
      <p className="text-slate-500 max-w-md">Próximamente vas a poder subir fotos y videos acá para actualizar automáticamente el contenido de tu Landing Page pública.</p>
    </div>
  )
}