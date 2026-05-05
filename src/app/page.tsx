"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin } from "lucide-react"
import Image from "next/image"

export default function LandingEditorial() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden font-sans">
      
      {/* BLOQUE DE COLOR LATERAL */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-900 hidden lg:block"></div>

      <div className="relative z-10 max-w-7xl mx-auto min-h-screen flex flex-col lg:flex-row items-center">
        
        {/* LADO IZQUIERDO */}
        <div className="flex-1 px-6 py-12 lg:py-0 space-y-10 animate-in fade-in slide-in-from-left-10 duration-1000">
          
          <div className="space-y-4">
            <h2 className="text-fuchsia-600 font-black text-xs uppercase tracking-[0.4em]">Estudio de Pole Dance & Fitness</h2>
            
            <div className="relative">
              <h1 className="text-8xl md:text-[12rem] font-black leading-[0.8] tracking-tighter text-slate-900 uppercase">
                POLE<br/>
                <span className="text-transparent" style={{ WebkitTextStroke: '2px #0f172a' }}>KITTY</span>
              </h1>
              
              <div className="absolute top-1/2 right-0 md:right-20 -translate-y-1/2 animate-bounce duration-[3000ms]">
                <Image 
                  src="/Polekitty-logo-blanco.png" 
                  alt="Logo" 
                  width={120} 
                  height={120} 
                  className="rounded-full border-4 border-white shadow-2xl invert"
                />
              </div>
            </div>
          </div>

          <div className="max-w-md space-y-6">
            <p className="text-slate-500 text-lg font-medium leading-relaxed">
              Transformá tu fuerza en arte. Un espacio diseñado para que explores tus límites, te diviertas y pertenezcas a una comunidad real.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login" className="flex-1">
                <Button className="w-full bg-slate-900 hover:bg-fuchsia-600 text-white h-16 rounded-none font-black uppercase tracking-widest transition-all">
                  Ingresar <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/registro" className="flex-1">
                <Button variant="outline" className="w-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white h-16 rounded-none font-black uppercase tracking-widest transition-all">
                  Registrarme
                </Button>
              </Link>
            </div>
          </div>

          {/* INFO ADICIONAL CON EL ICONO SVG DIRECTO */}
          <div className="flex items-center gap-8 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <MapPin className="h-4 w-4 text-fuchsia-500" /> Buenos Aires, AR
            </div>
            
            <a 
              href="https://instagram.com/polekitty__/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 hover:text-fuchsia-600 font-bold text-xs uppercase tracking-widest transition-colors"
            >
              {/* SVG de Instagram Manual para evitar errores de librerías */}
              <svg 
                width="16" height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-fuchsia-500"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
              @polekitty__/
            </a>
          </div>
        </div>

        {/* LADO DERECHO */}
        <div className="flex-1 relative w-full h-[60vh] lg:h-screen animate-in fade-in slide-in-from-right-10 duration-1000">
          <Image 
            src="/Florperfildenegro.jpg" 
            alt="Flor Pole Dance"
            fill
            className="object-cover object-center grayscale hover:grayscale-0 transition-all duration-700 cursor-pointer"
            priority
          />
          
          <div className="absolute -left-16 bottom-20 hidden xl:block">
            <div className="relative w-32 h-32 flex items-center justify-center animate-spin-slow">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                <text className="text-[10px] font-black uppercase tracking-[0.3em] fill-fuchsia-600">
                  <textPath xlinkHref="#circlePath">
                    • POWER • FLOW • COMMUNITY • ART •
                  </textPath>
                </text>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  )
}