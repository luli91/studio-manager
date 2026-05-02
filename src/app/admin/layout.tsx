"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { LayoutDashboard, Users, CalendarDays, Image as ImageIcon, Wallet, Settings, LogOut, Menu, X } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const menuItems = [
  { label: "Dashboard", path: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Alumnas", path: "/admin/alumnas", icon: <Users className="h-5 w-5" /> },
  { label: "Clases", path: "/admin/clases", icon: <CalendarDays className="h-5 w-5" /> },
  { label: "Multimedia", path: "/admin/multimedia", icon: <ImageIcon className="h-5 w-5" /> },
  { label: "Finanzas", path: "/admin/finanzas", icon: <Wallet className="h-5 w-5" /> },
  { label: "Configuración", path: "/admin/config", icon: <Settings className="h-5 w-5" /> },
]
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100 text-slate-900 font-sans">
      
      {/* Botón Hamburguesa (Mobile) */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 p-2 rounded-md text-white shadow-lg"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay Oscuro (Mobile) */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden" 
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* Sidebar de Admin */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-slate-50 p-6 flex flex-col z-40 transform transition-transform duration-300 ${menuAbierto ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 shadow-xl`}>
        
        <div className="mb-8 mt-12 md:mt-0">
          <h2 className="text-2xl font-black tracking-tight text-white">
            POLEKITTY<span className="text-fuchsia-500">ADMIN</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">Panel de Control</p>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={() => setMenuAbierto(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === item.path ? "bg-fuchsia-600 text-white shadow-md" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <button 
            onClick={handleCerrarSesion}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* El Contenido (El antiguo Outlet) */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}