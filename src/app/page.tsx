"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, Music, Calendar, Camera, PlayCircle } from "lucide-react"

// COMPONENTE NATIVO PARA SPOTIFY (Infalible)
const SpotifyCard = ({ url }: { url: string }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Extraemos el ID para obtener la info (usamos la API pública de oEmbed de Spotify)
    const regex = /(track|playlist|album)[/:]([a-zA-Z0-9]{22})/;
    const match = url.match(regex);
    
    if (match) {
      const type = match[1];
      const id = match[2];
      const cleanUrl = `https://open.spotify.com/${type}/${id}`;
      
      // Pedimos la info básica (título, autor, imagen) a Spotify sin cargar el reproductor
      fetch(`https://open.spotify.com/oembed?url=${cleanUrl}`)
        .then(res => res.json())
        .then(info => setData({ ...info, cleanUrl }))
        .catch(() => setData({ title: "Música de PoleKitty", cleanUrl }));
    }
  }, [url]);

  if (!data) return null; // No dibuja nada si el link estaba roto

  return (
    <a 
      href={data.cleanUrl} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="group relative flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:border-slate-300"
    >
      <div className="relative w-20 h-20 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
        {data.thumbnail_url ? (
          <img src={data.thumbnail_url} alt="Portada" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <Music className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
        )}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayCircle className="w-8 h-8 text-white fill-white/20" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 truncate">{data.title || "Track en Spotify"}</h3>
        <p className="text-sm text-slate-500 truncate mt-1">
          {data.author_name ? `Por ${data.author_name}` : "Escuchar en Spotify"}
        </p>
      </div>

      <div className="w-8 flex justify-center">
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-slate-800 opacity-50 group-hover:opacity-100 group-hover:fill-[#1DB954] transition-all"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
      </div>
    </a>
  )
}

export default function LandingEditorial() {
  const supabase = createClient()
  const [scrolled, setScrolled] = useState(false)
  
  const [eventos, setEventos] = useState<any[]>([])
  const [galeria, setGaleria] = useState<any[]>([])
  const [disciplinas, setDisciplinas] = useState<any[]>([])
  const [config, setConfig] = useState<any>({
    hero: { foto_portada: "/Florportada.jpeg", frase_streets: "Streets Group" },
    sobreMi: { foto: "/Florportada.jpeg", texto: "" },
    spotify: { canciones: [] } 
  })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)

    const fetchData = async () => {
      const [resEv, resGal, resDisc, resConf] = await Promise.all([
        supabase.from("landing_eventos").select("*").eq("activo", true),
        supabase.from("landing_multimedia").select("*").order("orden"),
        supabase.from("landing_disciplinas").select("*").order("orden"),
        supabase.from("configuracion").select("*")
      ])

      if (resEv.data) setEventos(resEv.data)
      if (resGal.data) setGaleria(resGal.data)
      if (resDisc.data) setDisciplinas(resDisc.data)
      
      if (resConf.data) {
        const c = resConf.data;
        let spot = c.find(x => x.key === 'landing_spotify')?.valor || { canciones: [] };
        if (spot.url && !spot.canciones) spot = { canciones: [spot.url] };

        setConfig({
          hero: c.find(x => x.key === 'landing_hero')?.valor || config.hero,
          sobreMi: c.find(x => x.key === 'landing_sobre_mi')?.valor || config.sobreMi,
          spotify: spot
        })
      }
    }
    fetchData()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative min-h-screen bg-white overflow-x-hidden font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 py-0' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="relative h-16 w-48"><Image src="/LOGO-POLEKITTY-Flor.png" alt="Logo" fill className="object-contain object-left" priority /></div>
          
          <div className={`hidden md:flex gap-8 text-[11px] font-black uppercase tracking-widest transition-colors ${scrolled ? 'text-slate-500' : 'text-slate-600'}`}>
            <a href="#clases" className="hover:text-slate-900 transition-colors">Clases</a>
            <a href="#galeria" className="hover:text-slate-900 transition-colors">Estudio</a>
            <a href="#eventos" className="hover:text-slate-900 transition-colors">Eventos</a>
          </div>
          
          <div className="flex gap-4">
             <Link href="/login"><Button variant="outline" className={`rounded-none font-black uppercase tracking-widest text-[10px] h-10 hidden sm:flex transition-colors bg-transparent ${scrolled ? 'border-slate-200 text-slate-900 hover:bg-slate-50' : 'border-slate-800 text-slate-900 lg:border-white/30 lg:text-white lg:hover:bg-white/10'}`}>Acceso Alumnas</Button></Link>
             <Link href="/registro"><Button className={`rounded-none font-black uppercase tracking-widest text-[10px] h-10 transition-colors ${scrolled ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-900 text-white lg:bg-white lg:text-slate-900 lg:hover:bg-slate-100'}`}>Registrarme</Button></Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen pt-20">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-900 hidden lg:block z-0"></div>
        <div className="relative z-10 max-w-7xl mx-auto min-h-[calc(100vh-80px)] flex flex-col lg:flex-row items-center">
          <div className="flex-1 px-6 py-12 lg:py-0 space-y-10 animate-in fade-in slide-in-from-left-10 duration-1000">
            <div className="space-y-4">
              <h2 className="text-slate-500 font-black text-xs uppercase tracking-[0.4em]">Estudio de Pole Dance & Fitness</h2>
              <div className="relative">
                <h1 className="text-8xl md:text-[12rem] font-black leading-[0.8] tracking-tighter text-slate-900 uppercase">POLE<br/><span className="text-transparent" style={{ WebkitTextStroke: '2px #0f172a' }}>KITTY</span></h1>
                <div className="absolute top-1/2 right-0 md:right-5 -translate-y-1/2 animate-bounce duration-[3000ms]">
                  <div className="rounded-full p-5 flex items-center justify-center"><Image src="/LOGO-POLEKITTY-Flor.png" alt="Logo" width={130} height={130} className="object-contain w-24 h-24 md:w-[130px] md:h-[130px]" priority /></div>
                </div>
              </div>
            </div>
            <div className="max-w-md space-y-6">
              <p className="text-slate-500 text-lg font-medium leading-relaxed">{config.hero.frase_streets || "Streets Group"}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="flex-1"><Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-16 rounded-none font-black uppercase tracking-widest transition-all">Ingresar <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
                <Link href="/registro" className="flex-1"><Button variant="outline" className="w-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white h-16 rounded-none font-black uppercase tracking-widest transition-all">Registrarme</Button></Link>
              </div>
            </div>
          </div>
          <div className="flex-1 relative w-full h-[60vh] lg:h-[calc(100vh-80px)] animate-in fade-in slide-in-from-right-10 duration-1000 z-10">
            <img src={config.hero.foto_portada || "/Florportada.jpeg"} alt="Portada" className="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-700" />
            <div className="absolute -left-16 bottom-20 hidden xl:block">
              <div className="relative w-32 h-32 flex items-center justify-center animate-spin-slow">
                <svg viewBox="0 0 100 100" className="w-full h-full"><path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" /><text className="text-[10px] font-black uppercase tracking-[0.15em] fill-slate-900"><textPath xlinkHref="#circlePath">• STREETS GROUP • STREETS GROUP</textPath></text></svg>
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-2 h-2 bg-slate-900 rounded-full"></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DISCIPLINAS */}
      <section id="clases" className="py-32 px-6 max-w-7xl mx-auto border-t border-slate-100">
        <div className="mb-16"><h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-900">Nuestras Clases</h2><div className="h-2 w-20 bg-slate-900 mt-4" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {disciplinas.length > 0 ? (
            disciplinas.map((clase, i) => (
              <div key={clase.id} className="group cursor-default">
                <div className="h-80 bg-slate-100 rounded-none overflow-hidden relative mb-6 grayscale group-hover:grayscale-0 transition-all duration-700">
                  {clase.imagen_url ? <img src={clase.imagen_url} className="w-full h-full object-cover" alt={clase.titulo} /> : <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-black text-6xl italic">0{i+1}</div>}
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">{clase.titulo}</h3>
                <p className="text-slate-500 mt-2 font-medium leading-relaxed">{clase.descripcion}</p>
              </div>
            ))
          ) : <p className="text-muted-foreground italic col-span-3">No hay disciplinas cargadas.</p>}
        </div>
      </section>

      {/* ESTUDIO / GALERIA */}
      <section id="galeria" className="py-32 px-6 max-w-7xl mx-auto border-t border-slate-100">
        <div className="mb-16 text-center"><h2 className="text-4xl md:text-5xl font-black uppercase italic">El Estudio</h2></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galeria.map((foto, idx) => (
            <div key={foto.id} className={`relative bg-slate-100 overflow-hidden group aspect-square ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}>
              <img src={foto.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Estudio" />
            </div>
          ))}
        </div>
      </section>

      {/* SOBRE MI */}
      <section id="sobre-mi" className="bg-slate-900 py-32 px-6 text-white relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/5] bg-white/5 border border-white/10">
            <img src={config.sobreMi.foto || "/Florportada.jpeg"} alt="Flor" className="w-full h-full object-cover p-1 opacity-80" />
          </div>
          <div className="space-y-8">
            <h2 className="text-5xl md:text-6xl font-black uppercase italic leading-none">Hola, soy Flor.</h2>
            <p className="text-xl text-white/80 font-light leading-relaxed">"{config.sobreMi.texto || 'Tu objetivo es mi objetivo.'}"</p>
          </div>
        </div>
      </section>

      {/* EVENTOS */}
      {eventos.length > 0 && (
        <section id="eventos" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16"><h2 className="text-5xl font-black uppercase italic">Próximos Eventos</h2></div>
          <div className="space-y-10">
            {eventos.map(ev => (
              <div key={ev.id} className="relative bg-slate-900 text-white flex flex-col md:flex-row group overflow-hidden">
                <div className="md:w-1/2 h-72 md:h-auto overflow-hidden">
                  <img src={ev.imagen_url} alt={ev.titulo} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 grayscale group-hover:grayscale-0" />
                </div>
                <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center space-y-6">
                  <h3 className="text-4xl font-black uppercase">{ev.titulo}</h3>
                  <p className="text-slate-400 text-lg">{ev.descripcion}</p>
                  <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                    <p className="text-5xl font-black tracking-tighter">${ev.precio}</p>
                    <Link href="/registro"><Button className="rounded-none bg-white text-slate-900 px-10 h-16 font-black uppercase">Inscribirme</Button></Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MUSICA / SPOTIFY (SIN IFRAMES) */}
      {config.spotify.canciones && config.spotify.canciones.length > 0 && (
         <section className="py-32 px-6 bg-slate-50 text-center border-t border-slate-100">
            <Music className="w-12 h-12 mx-auto text-slate-300 mb-6" />
            <h2 className="text-4xl font-black uppercase italic mb-12">Vibra PoleKitty</h2>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
               {config.spotify.canciones.map((url: string, idx: number) => (
                   <SpotifyCard key={idx} url={url} />
               ))}
            </div>
         </section>
      )}

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-6 text-center md:text-left">
            <div className="relative h-24 w-64 mx-auto md:mx-0"><Image src="/LOGO-POLEKITTY-Flor.png" alt="Logo" fill className="object-contain" /></div>
            <p className="text-slate-500 text-sm font-medium">Villa Madero, Buenos Aires.</p>
          </div>
          <div className="space-y-4 text-center md:text-left">
            <h4 className="font-black uppercase text-xs tracking-widest border-b pb-2 inline-block">Contacto</h4>
            <div className="space-y-3 pt-2 flex flex-col items-center md:items-start text-slate-500 font-bold text-sm">
              <a href="https://instagram.com/polekitty__/" target="_blank" className="hover:text-slate-900 transition-colors italic">@polekitty__</a>
              <a href="https://wa.me/5491141429761" target="_blank" className="hover:text-slate-900 transition-colors italic">WhatsApp</a>
              <p>Pedernera 1103</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end justify-between">
             <Link href="/login"><Button variant="outline" className="rounded-none border-slate-900 text-slate-900 font-black uppercase px-8">Staff / Alumnas</Button></Link>
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-4">© 2026 PoleKitty Studio.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </div>
  )
}