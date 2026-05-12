"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Save, Loader2, Plus, Trash2, Music, User, Star, Layout, Camera, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function MultimediaPage() {
  const supabase = createClient()
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)

  // ESTADOS DE LA LANDING
  const [hero, setHero] = useState<any>({})
  const [sobreMi, setSobreMi] = useState<any>({})
  
  // NUEVO ESTADO PARA SPOTIFY (Múltiples canciones)
  const [spotify, setSpotify] = useState<{ canciones: string[] }>({ canciones: [] })
  const [nuevaCancion, setNuevaCancion] = useState("")

  const [disciplinas, setDisciplinas] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [galeria, setGaleria] = useState<any[]>([])

  // ESTADOS PARA CREACIÓN (Formularios de arriba)
  const [nuevaDisciplina, setNuevaDisciplina] = useState({ titulo: "", descripcion: "", imagen_url: "" })
  const [nuevoEvento, setNuevoEvento] = useState({ titulo: "", descripcion: "", precio: "", imagen_url: "", activo: true })

  const cargarTodo = async () => {
    setCargando(true)
    const [resConfig, resDisc, resEv, resGal] = await Promise.all([
      supabase.from("configuracion").select("*"),
      supabase.from("landing_disciplinas").select("*").order("orden"),
      supabase.from("landing_eventos").select("*").order("created_at"),
      supabase.from("landing_multimedia").select("*").order("orden")
    ])

    if (resConfig.data) {
      const config = resConfig.data
      setHero(config.find(c => c.key === 'landing_hero')?.valor || { foto_portada: "", frase_streets: "" })
      setSobreMi(config.find(c => c.key === 'landing_sobre_mi')?.valor || { foto: "", texto: "" })
      
      // Adaptar la música vieja al nuevo formato de lista
      const spotData = config.find(c => c.key === 'landing_spotify')?.valor || { canciones: [] };
      if (spotData.url && !spotData.canciones) {
          setSpotify({ canciones: [spotData.url] }); // Si había un link viejo, lo mete en la lista
      } else {
          setSpotify(spotData.canciones ? spotData : { canciones: [] });
      }
    }
    if (resDisc.data) setDisciplinas(resDisc.data)
    if (resEv.data) setEventos(resEv.data)
    if (resGal.data) setGaleria(resGal.data)
    setCargando(false)
  }

  useEffect(() => { cargarTodo() }, [])

  const subirImagenStorage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { error: uploadError } = await supabase.storage.from('landing').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('landing').getPublicUrl(filePath)
      return data.publicUrl
    } catch (error: any) {
      toast.error("Error al subir imagen: " + error.message)
      return null
    }
  }

  const saveConfig = async (key: string, valor: any) => {
    setGuardando(true)
    const { error } = await supabase.from("configuracion").upsert({ key, valor })
    if (error) toast.error("Error al guardar")
    else toast.success("¡Sección actualizada!")
    setGuardando(false)
  }

  const crearDisciplina = async () => {
    if (!nuevaDisciplina.titulo) return toast.error("Escribí un título para la clase.")
    setGuardando(true)
    const { data } = await supabase.from("landing_disciplinas").insert([nuevaDisciplina]).select()
    if (data) {
      setDisciplinas([...disciplinas, data[0]])
      setNuevaDisciplina({ titulo: "", descripcion: "", imagen_url: "" }) 
      toast.success("¡Clase agregada con éxito!")
    }
    setGuardando(false)
  }

  const eliminarDisciplina = async (id: string) => {
    await supabase.from("landing_disciplinas").delete().eq("id", id)
    setDisciplinas(disciplinas.filter(d => d.id !== id))
  }

  const crearEvento = async () => {
    if (!nuevoEvento.titulo) return toast.error("Escribí un título para el evento.")
    setGuardando(true)
    const { data } = await supabase.from("landing_eventos").insert([nuevoEvento]).select()
    if (data) {
      setEventos([...eventos, data[0]])
      setNuevoEvento({ titulo: "", descripcion: "", precio: "", imagen_url: "", activo: true })
      toast.success("¡Evento agregado con éxito!")
    }
    setGuardando(false)
  }

  const eliminarEvento = async (id: string) => {
    await supabase.from("landing_eventos").delete().eq("id", id)
    setEventos(eventos.filter(e => e.id !== id))
  }

  const handleGaleriaUpload = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo(true)
    const url = await subirImagenStorage(file)
    if (url) {
      const { data } = await supabase.from("landing_multimedia").insert([{ url, tipo: "foto", orden: galeria.length }]).select()
      if (data) {
        setGaleria([...galeria, data[0]])
        toast.success("¡Foto agregada al estudio!")
      }
    }
    setSubiendo(false)
  }

  // --- MÚSICA ---
  const agregarCancion = () => {
    if (!nuevaCancion) return toast.error("Pegá un enlace válido.");
    if (spotify.canciones.length >= 10) return toast.error("Máximo 10 canciones permitidas.");
    setSpotify({ canciones: [...spotify.canciones, nuevaCancion] });
    setNuevaCancion("");
  }

  const eliminarCancion = (index: number) => {
    const nuevas = spotify.canciones.filter((_, i) => i !== index);
    setSpotify({ canciones: nuevas });
  }

  if (cargando) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>

  return (
    <div className="space-y-10 pb-20 animate-in fade-in text-foreground">
      <header>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Editor de Contenido Web</h1>
        <p className="text-muted-foreground">Personalizá las fotos, textos y eventos de tu Landing Page.</p>
      </header>

      <Tabs defaultValue="portada" className="w-full">
        <TabsList className="bg-muted p-1 h-auto grid grid-cols-2 md:grid-cols-6 gap-2">
          <TabsTrigger value="portada" className="py-3 font-bold"><Layout className="w-4 h-4 mr-2"/> Portada</TabsTrigger>
          <TabsTrigger value="clases" className="py-3 font-bold"><Star className="w-4 h-4 mr-2"/> Clases</TabsTrigger>
          <TabsTrigger value="galeria" className="py-3 font-bold"><Camera className="w-4 h-4 mr-2"/> Estudio</TabsTrigger>
          <TabsTrigger value="sobre-mi" className="py-3 font-bold"><User className="w-4 h-4 mr-2"/> Sobre Mí</TabsTrigger>
          <TabsTrigger value="eventos" className="py-3 font-bold"><Star className="w-4 h-4 mr-2"/> Eventos</TabsTrigger>
          <TabsTrigger value="musica" className="py-3 font-bold"><Music className="w-4 h-4 mr-2"/> Música</TabsTrigger>
        </TabsList>

        <TabsContent value="portada" className="pt-6">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle>Imagen de Portada Principal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL de la Foto de Portada</Label>
                <div className="flex gap-2">
                  <Input placeholder="https://..." value={hero.foto_portada} onChange={(e: any) => setHero({...hero, foto_portada: e.target.value})} className="flex-1" />
                  <Label className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center px-4 rounded-md font-bold text-xs uppercase tracking-widest">
                    {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Subir Foto</>}
                    <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                      if (!e.target.files?.[0]) return;
                      setSubiendo(true);
                      const url = await subirImagenStorage(e.target.files[0]);
                      if (url) { setHero({...hero, foto_portada: url}); toast.success("Foto cargada, recordá guardar los cambios."); }
                      setSubiendo(false);
                    }}/>
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Texto de bienvenida (Pequeño)</Label>
                <Input value={hero.frase_streets} onChange={(e: any) => setHero({...hero, frase_streets: e.target.value})} />
              </div>
              <Button onClick={() => saveConfig('landing_hero', hero)} disabled={guardando || subiendo} className="font-bold">
                {guardando ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clases" className="pt-6 space-y-10">
          <div className="bg-muted/50 border border-border p-6 rounded-xl space-y-4">
            <h3 className="font-black uppercase tracking-widest flex items-center"><Plus className="w-5 h-5 mr-2 text-primary" /> Agregar Nueva Clase</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título de la Clase</Label>
                <Input placeholder="Ej: Pole Exotic" value={nuevaDisciplina.titulo} onChange={(e: any) => setNuevaDisciplina({...nuevaDisciplina, titulo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Foto de la clase</Label>
                <div className="flex gap-2">
                    <Input placeholder="URL o subir foto ->" value={nuevaDisciplina.imagen_url} onChange={(e: any) => setNuevaDisciplina({...nuevaDisciplina, imagen_url: e.target.value})} className="flex-1" />
                    <Label className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center px-4 rounded-md">
                        {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                        if (!e.target.files?.[0]) return;
                        setSubiendo(true);
                        const url = await subirImagenStorage(e.target.files[0]);
                        if (url) { setNuevaDisciplina({...nuevaDisciplina, imagen_url: url}); toast.success("Foto cargada lista para agregar"); }
                        setSubiendo(false);
                        }}/>
                    </Label>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Descripción</Label>
                <Textarea placeholder="De qué trata la clase..." value={nuevaDisciplina.descripcion} onChange={(e: any) => setNuevaDisciplina({...nuevaDisciplina, descripcion: e.target.value})} />
              </div>
            </div>
            <Button onClick={crearDisciplina} disabled={guardando || subiendo} className="w-full font-bold uppercase tracking-widest">Crear Clase</Button>
          </div>
          <div className="h-px bg-border w-full"></div>
          <div>
            <h3 className="font-black uppercase tracking-widest mb-6">Clases Creadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {disciplinas.map((disc) => (
                <Card key={disc.id} className="relative border-border bg-card">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => eliminarDisciplina(disc.id)}><Trash2 className="w-4 h-4"/></Button>
                    <CardContent className="pt-8 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Título</Label>
                        <Input value={disc.titulo} onChange={(e: any) => {
                        const nd = [...disciplinas]; nd.find(x => x.id === disc.id).titulo = e.target.value; setDisciplinas(nd);
                        }} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Descripción</Label>
                        <Textarea value={disc.descripcion} onChange={(e: any) => {
                        const nd = [...disciplinas]; nd.find(x => x.id === disc.id).descripcion = e.target.value; setDisciplinas(nd);
                        }} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">URL Imagen</Label>
                        <div className="flex gap-2">
                        <Input value={disc.imagen_url} onChange={(e: any) => {
                            const nd = [...disciplinas]; nd.find(x => x.id === disc.id).imagen_url = e.target.value; setDisciplinas(nd);
                        }} className="flex-1 text-xs" />
                        <Label className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center px-3 rounded-md">
                            {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                            if (!e.target.files?.[0]) return;
                            setSubiendo(true);
                            const url = await subirImagenStorage(e.target.files[0]);
                            if (url) { const nd = [...disciplinas]; nd.find(x => x.id === disc.id).imagen_url = url; setDisciplinas(nd); toast.success("Foto nueva lista, click en Guardar"); }
                            setSubiendo(false);
                            }}/>
                        </Label>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full font-bold" disabled={subiendo} onClick={() => supabase.from("landing_disciplinas").upsert(disc).then(() => toast.success("Cambios guardados"))}>Guardar Cambios</Button>
                    </CardContent>
                </Card>
                ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="galeria" className="pt-6 space-y-6">
          <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border">
            <div>
                <h2 className="text-xl font-bold">Fotos de la Galería</h2>
                <p className="text-sm text-muted-foreground">Elegí fotos para mostrar el estudio.</p>
            </div>
            <Label className={`cursor-pointer ${subiendo ? 'bg-primary/50' : 'bg-primary hover:bg-primary/90'} text-primary-foreground font-black uppercase italic flex items-center justify-center px-6 py-2 rounded-md transition-colors`}>
                {subiendo ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <Upload className="w-4 h-4 mr-2"/>}
                Subir desde Galería
                <input type="file" accept="image/*" className="hidden" onChange={handleGaleriaUpload} disabled={subiendo} />
            </Label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {galeria.map((foto) => (
              <Card key={foto.id} className="bg-card border-border overflow-hidden group relative">
                <div className="aspect-square relative bg-muted">
                  {foto.url && <img src={foto.url} className="object-cover w-full h-full" alt="Miniatura" />}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="icon" onClick={async () => {
                        await supabase.from("landing_multimedia").delete().eq("id", foto.id);
                        setGaleria(galeria.filter(f => f.id !== foto.id));
                      }}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sobre-mi" className="pt-6">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle>Sección Personal</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tu Foto (Sección Sobre mí)</Label>
                <div className="flex gap-2">
                  <Input value={sobreMi.foto} onChange={(e: any) => setSobreMi({...sobreMi, foto: e.target.value})} className="flex-1" />
                  <Label className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center px-4 rounded-md font-bold text-xs uppercase tracking-widest">
                    {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Subir Foto</>}
                    <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                      if (!e.target.files?.[0]) return;
                      setSubiendo(true);
                      const url = await subirImagenStorage(e.target.files[0]);
                      if (url) { setSobreMi({...sobreMi, foto: url}); toast.success("Foto cargada, recordá guardar los cambios."); }
                      setSubiendo(false);
                    }}/>
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción Personal</Label>
                <Textarea className="h-40" value={sobreMi.texto} onChange={(e: any) => setSobreMi({...sobreMi, texto: e.target.value})} />
              </div>
              <Button onClick={() => saveConfig('landing_sobre_mi', sobreMi)} disabled={guardando || subiendo} className="font-bold">
                {guardando ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Guardar Perfil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos" className="pt-6 space-y-10">
          <div className="bg-muted/50 border border-border p-6 rounded-xl space-y-4">
            <h3 className="font-black uppercase tracking-widest flex items-center"><Plus className="w-5 h-5 mr-2 text-primary" /> Agregar Nuevo Evento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2"><Label>Título del Evento</Label><Input value={nuevoEvento.titulo} onChange={(e: any) => setNuevoEvento({...nuevoEvento, titulo: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Precio de la entrada</Label><Input value={nuevoEvento.precio} onChange={(e: any) => setNuevoEvento({...nuevoEvento, precio: e.target.value})} /></div>
                    <div className="space-y-2">
                        <Label>Foto/Flyer del Evento</Label>
                        <div className="flex gap-2">
                            <Input value={nuevoEvento.imagen_url} onChange={(e: any) => setNuevoEvento({...nuevoEvento, imagen_url: e.target.value})} className="flex-1" />
                            <Label className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center px-4 rounded-md">
                                {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                                if (!e.target.files?.[0]) return;
                                setSubiendo(true);
                                const url = await subirImagenStorage(e.target.files[0]);
                                if (url) { setNuevoEvento({...nuevoEvento, imagen_url: url}); toast.success("Flyer cargado listo para agregar"); }
                                setSubiendo(false);
                                }}/>
                            </Label>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Descripción del evento</Label>
                        <Textarea className="h-[120px]" value={nuevoEvento.descripcion} onChange={(e: any) => setNuevoEvento({...nuevoEvento, descripcion: e.target.value})} />
                    </div>
                    <Button onClick={crearEvento} disabled={guardando || subiendo} className="w-full font-bold uppercase tracking-widest h-12">Crear Evento</Button>
                </div>
            </div>
          </div>
          <div className="h-px bg-border w-full"></div>
          <div>
            <h3 className="font-black uppercase tracking-widest mb-6">Eventos Creados</h3>
            <div className="space-y-6">
                {eventos.map((ev) => (
                <Card key={ev.id} className="border-border bg-card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2"><Label>Título</Label><Input value={ev.titulo} onChange={(e: any) => { const n = [...eventos]; n.find(x => x.id === ev.id).titulo = e.target.value; setEventos(n); }}/></div>
                        <div className="space-y-2"><Label>Precio</Label><Input value={ev.precio} onChange={(e: any) => { const n = [...eventos]; n.find(x => x.id === ev.id).precio = e.target.value; setEventos(n); }}/></div>
                        <div className="space-y-2">
                        <Label>Imagen URL</Label>
                        <div className="flex gap-2">
                            <Input value={ev.imagen_url} onChange={(e: any) => { const n = [...eventos]; n.find(x => x.id === ev.id).imagen_url = e.target.value; setEventos(n); }} className="flex-1 text-xs" />
                            <Label className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center px-3 rounded-md">
                            {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                                if (!e.target.files?.[0]) return;
                                setSubiendo(true);
                                const url = await subirImagenStorage(e.target.files[0]);
                                if (url) { const n = [...eventos]; n.find(x => x.id === ev.id).imagen_url = url; setEventos(n); toast.success("Flyer nuevo listo, click en Guardar"); }
                                setSubiendo(false);
                            }}/>
                            </Label>
                        </div>
                        </div>
                    </div>
                    <div className="space-y-4 flex flex-col">
                        <div className="space-y-2"><Label>Descripción</Label><Textarea className="h-[120px]" value={ev.descripcion} onChange={(e: any) => { const n = [...eventos]; n.find(x => x.id === ev.id).descripcion = e.target.value; setEventos(n); }}/></div>
                        <div className="flex gap-2 mt-auto">
                        <Button variant="outline" className="flex-1 font-bold" disabled={subiendo} onClick={() => supabase.from("landing_eventos").upsert(ev).then(() => toast.success("Evento actualizado"))}>Guardar Cambios</Button>
                        <Button variant="destructive" size="icon" onClick={() => eliminarEvento(ev.id)}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                    </div>
                    </div>
                </Card>
                ))}
            </div>
          </div>
        </TabsContent>

        {/* --- SPOTIFY (LISTA DE CANCIONES MÚLTIPLES) --- */}
        <TabsContent value="musica" className="pt-6">
          <Card className="border-border bg-card">
            <CardHeader>
               <CardTitle>Playlist del Estudio (Máx 10 canciones/playlists)</CardTitle>
               <p className="text-sm text-muted-foreground">Pegá el link de Spotify de cada canción o playlist que quieras mostrar.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4 items-end">
                <div className="space-y-2 flex-1">
                  <Label>Link de Spotify (Elegir "Compartir" -&gt; "Copiar enlace")</Label>
                  <Input placeholder="Ej: https://open.spotify.com/track/..." value={nuevaCancion} onChange={(e: any) => setNuevaCancion(e.target.value)} />
                </div>
                <Button onClick={agregarCancion} className="font-bold"><Plus className="w-4 h-4 mr-2"/> Agregar a lista</Button>
              </div>

              <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border min-h-[100px]">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Canciones en tu Web: {spotify.canciones.length}/10</h4>
                
                {spotify.canciones.map((url, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-card border border-border rounded-md shadow-sm">
                     <span className="text-sm truncate w-3/4 text-muted-foreground">{url}</span>
                     <Button variant="destructive" size="sm" onClick={() => eliminarCancion(idx)}><Trash2 className="w-4 h-4"/></Button>
                  </div>
                ))}

                {spotify.canciones.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-4">No agregaste música todavía.</p>}
              </div>

              <Button onClick={() => saveConfig('landing_spotify', spotify)} disabled={guardando} className="font-bold w-full h-12 text-lg">
                {guardando ? <Loader2 className="animate-spin h-5 w-5 mr-2"/> : <Save className="h-5 w-5 mr-2"/>} Publicar Lista en la Web
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}