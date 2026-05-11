import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Phone, MapPin, AlertCircle, ChevronDown, ChevronUp, UserMinus } from "lucide-react"

export default function VistaDashboard({ perfil, clasesHoy }: { perfil: any, clasesHoy: any[] }) {
  const [alumnaExpandida, setAlumnaExpandida] = useState<string | null>(null)

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in pb-12 text-foreground">
      <header className="text-center">
        <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter italic leading-none">
          ¡Hola, {perfil?.nombre || perfil?.nombre_completo?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground font-medium mt-2">
          Grilla y asistencia para hoy: {format(new Date(), "dd/MM/yyyy")}
        </p>
      </header>

      {clasesHoy.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-[2.5rem] p-20 text-center space-y-4 shadow-sm">
          <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs italic">No tenés clases asignadas para hoy</p>
        </div>
      ) : (
        clasesHoy.map(clase => {
          const esAusente = clase.profesor_ausente_id === perfil?.id
          const reservasConfirmadas = clase.reservas?.filter((r: any) => r.estado !== 'cancelada') || []
          const reservasCanceladas = clase.reservas?.filter((r: any) => r.estado === 'cancelada') || []

          return (
            <div key={clase.id} className={`bg-card rounded-[2.5rem] border ${esAusente ? 'border-destructive/40' : 'border-border'} shadow-sm overflow-hidden mb-6 relative`}>
              
              {esAusente && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-8">
                  <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4 shadow-lg shadow-destructive/20">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">Estás Ausente</h3>
                  <p className="text-muted-foreground font-medium mt-2">Flor liberó esta clase para que la tome una suplente.</p>
                </div>
              )}

              <div className={`p-6 ${esAusente ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'} flex justify-between items-center transition-colors`}>
                <div>
                  <p className="text-primary-foreground/70 text-[10px] font-black uppercase tracking-widest italic">Clase</p>
                  <h3 className="text-xl font-bold uppercase tracking-tighter">{clase.nivel}</h3>
                </div>
                <div className="bg-background/10 px-4 py-2 rounded-2xl font-black text-sm border border-background/10">{clase.horario.slice(0,5)} HS</div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2 mb-3 italic flex justify-between items-center">
                    <span>Listado de asistencia ({reservasConfirmadas.length})</span>
                    <span className="bg-secondary text-secondary-foreground border border-border px-2 py-1 rounded-full normal-case text-xs">
                      {reservasConfirmadas.length} / {clase.cupo_maximo} ocupados
                    </span>
                  </p>
                  
                  {reservasConfirmadas.length === 0 ? (
                    <p className="text-center text-muted-foreground italic py-4 text-sm bg-muted/30 rounded-2xl border border-border">Sin alumnas anotadas aún.</p>
                  ) : (
                    <div className="space-y-3">
                      {reservasConfirmadas.map((res: any, index: number) => (
                        <div key={res.id} className="border border-border rounded-[1.5rem] overflow-hidden shadow-sm hover:border-primary/50 transition-all bg-background">
                          <button 
                            onClick={() => setAlumnaExpandida(alumnaExpandida === res.id ? null : res.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors text-left"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-black text-primary bg-background h-7 w-7 rounded-full flex items-center justify-center border border-border shadow-sm shrink-0">
                                {index + 1}
                              </span>
                              <span className="font-bold text-foreground uppercase text-sm tracking-tight truncate">
                                {res.perfiles?.nombre ? `${res.perfiles.nombre} ${res.perfiles.apellido}` : res.perfiles?.nombre_completo || "Alumna"}
                              </span>
                            </div>
                            {alumnaExpandida === res.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                          </button>

                          {alumnaExpandida === res.id && (
                            <div className="p-6 bg-card border-t border-border animate-in slide-in-from-top-2 duration-300">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Phone className="h-3 w-3" /> WhatsApp</p>
                                  <p className="font-bold text-foreground text-sm">{res.perfiles?.telefono || "No disponible"}</p>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><MapPin className="h-3 w-3" /> Dirección</p>
                                  <p className="font-bold text-foreground text-sm uppercase">
                                    {res.perfiles?.calle ? `${res.perfiles.calle} ${res.perfiles.numero_calle}, ${res.perfiles.barrio_localidad}` : res.perfiles?.direccion || "Sin dirección"}
                                  </p>
                                </div>
                                <div className="space-y-1 md:col-span-2 mt-2 p-3 bg-secondary/50 rounded-2xl border border-border">
                                  <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><AlertCircle className="h-3 w-3" /> Contacto de Emergencia</p>
                                  <p className="font-black text-foreground text-sm uppercase mt-1">{res.perfiles?.contacto_urgencia || "No cargado"}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {reservasCanceladas.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-dashed border-border">
                    <p className="text-[10px] font-black text-destructive uppercase tracking-widest ml-2 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Bajas de último momento ({reservasCanceladas.length})
                    </p>
                    <div className="space-y-2">
                      {reservasCanceladas.map((res: any) => (
                        <div key={res.id} className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-2xl opacity-80">
                          <div className="p-2 bg-destructive/20 rounded-full shrink-0 text-destructive">
                            <UserMinus className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground uppercase">
                              {res.perfiles?.nombre ? `${res.perfiles.nombre} ${res.perfiles.apellido}` : res.perfiles?.nombre_completo || "Alumna"}
                            </p>
                            <p className="text-xs font-bold text-destructive">Liberó su lugar</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}