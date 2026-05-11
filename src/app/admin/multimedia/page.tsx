import { ImageIcon } from "lucide-react"

export default function MultimediaPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
      <div className="bg-secondary p-4 rounded-full text-secondary-foreground">
        <ImageIcon className="h-12 w-12" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Gestor Multimedia</h1>
      <p className="text-muted-foreground max-w-md">Próximamente vas a poder subir fotos y videos acá para actualizar automáticamente el contenido de tu Landing Page pública.</p>
    </div>
  )
}