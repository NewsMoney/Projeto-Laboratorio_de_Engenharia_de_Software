import { useMemo, useState } from "react";
import { useLocation } from "wouter";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getLoginUrl } from "@/const";

import LeafletMap from "@/components/LeafletMap";

import {
  Search,
  User,
  Bell,
  SlidersHorizontal,
  Calendar,
  Music4,
  Radio,
  X,
  Sparkles,
  MapPin,
  Trophy,
  LogOut
} from "lucide-react";

// Importando componentes e constantes de layoutbars.tsx
import { DesktopSidebar, BottomNav } from "../components/LayoutBars";

/* ================================================== */
/* CONFIGURAÇÕES E CONSTANTES */
/* ================================================== */

const logo = "src/components/ui/logo-icon.png";

const FILTERS = [
  { label: "Todos", icon: Sparkles },
  { label: "Festas", icon: Music4 },
  { label: "Bares", icon: Radio },
  { label: "Shows", icon: Calendar },
];

/* ================================================== */
/* COMPONENTE PRINCIPAL: HOME */
/* ================================================== */

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");

  const { data: topPlaces } = trpc.places.topPlaces.useQuery({ limit: 50 });

  // Lógica de Filtro Unificada
  const filteredPlaces = useMemo(() => {
    if (!topPlaces) return [];
    return topPlaces.filter((place) => {
      const matchesSearch = 
        place.name.toLowerCase().includes(search.toLowerCase()) ||
        place.address.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = 
        activeFilter === "Todos" || place.category?.toLowerCase() === activeFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [topPlaces, search, activeFilter]);

  const mapPlaces = filteredPlaces.map((p) => ({ ...p }));

  return (
    <div 
      className="fixed inset-0 flex flex-col lg:flex-row overflow-hidden select-none" 
      style={{ background: theme.colors.background }}
    >
      {/* 1. SIDEBAR (DESKTOP) */}
      <DesktopSidebar />

      {/* 2. CONTEÚDO PRINCIPAL (MAPA + OVERLAYS) */}
      <main className="flex-1 relative h-full">
        
        {/* MAPA (Fundo) */}
        <LeafletMap
          places={mapPlaces}
          onPlaceClick={(place) => setLocation(`/details/${place.id}`)}
          showUserLocation
          className="absolute inset-0 z-0"
        />

        {/* UI MOBILE (Header + Search + Filters) */}
        <div className="lg:hidden relative z-[1000] px-5 pt-6 pb-2 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
          <MobileHeader
            user={user}
            isAuthenticated={isAuthenticated}
            onProfile={() => setLocation("/profile")}
            onLogin={() => setLocation("/login")}
          />

          <SearchBar value={search} onChange={setSearch} onClear={() => setSearch("")} />

          <FilterTabs activeFilter={activeFilter} onSelect={setActiveFilter} />
        </div>

        {/* UI DESKTOP (Search flutuante no mapa) */}
        <div className="hidden lg:block absolute top-8 left-8 z-[1000] w-96">
           <SearchBar value={search} onChange={setSearch} onClear={() => setSearch("")} />
        </div>

        {/* CTA FLUTUANTE (Acima do BottomNav) */}
        <NearbyButton count={filteredPlaces.length} />

        {/* 3. BOTTOM NAV (MOBILE) */}
        <BottomNav />
      </main>
    </div>
  );
}

/* ================================================== */
/* COMPONENTES DE UI AUXILIARES */
/* ================================================== */

function MobileHeader({ isAuthenticated, onProfile, onLogin }: any) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-0">
        <img src= {logo} alt="Logo" className="w-16 h-16 object-contain drop-shadow-[0_0_8px_#00FF66]" />
        <h1 className="text-3xl font-extrabold tracking-tighter text-white">
          Join<span style={{ color: theme.colors.primary }}>Me</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 active:scale-90 transition-transform">
          <Bell size={24} style={{ color: theme.colors.primary }} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-black" style={{ background: theme.colors.primary }} />
        </button>
        <button onClick={isAuthenticated ? onProfile : onLogin} className="w-10 h-10 rounded-full border flex items-center justify-center active:scale-90" style={{ borderColor: theme.colors.border, background: theme.colors.surface }}>
          <User size={20} className="text-[#a1a1aa]" />
        </button>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, onClear }: any) {
  return (
    <div className="h-14 rounded-full px-5 flex items-center gap-4 mb-4 border backdrop-blur-md shadow-2xl" style={{ background: "rgba(11, 11, 11, 0.85)", borderColor: theme.colors.border }}>
      <Search size={20} style={{ color: theme.colors.textMuted }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Buscar festas, DJs, locais..." className="flex-1 bg-transparent outline-none text-base text-white placeholder:text-zinc-500" />
      {value ? (
        <button onClick={onClear} className="p-1"><X size={18} style={{ color: theme.colors.textMuted }} /></button>
      ) : (
        <button className="w-9 h-9 rounded-full border flex items-center justify-center active:scale-90" style={{ borderColor: theme.colors.border }}>
          <SlidersHorizontal size={16} style={{ color: theme.colors.primary }} />
        </button>
      )}
    </div>
  );
}

function FilterTabs({ activeFilter, onSelect }: any) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      {FILTERS.map((item) => (
        <button
          key={item.label}
          onClick={() => onSelect(item.label)}
          className={cn("h-10 px-5 rounded-full border flex items-center gap-2 whitespace-nowrap text-xs font-bold transition-all")}
          style={{
            borderColor: activeFilter === item.label ? theme.colors.primary : theme.colors.border,
            color: activeFilter === item.label ? "black" : theme.colors.textSoft,
            background: activeFilter === item.label ? theme.colors.primary : theme.colors.surface,
            boxShadow: activeFilter === item.label ? "0 0 15px rgba(0,255,102,0.2)" : "none"
          }}
        >
          <item.icon size={14} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

function NearbyButton({ count }: { count: number }) {
  return (
    <div className="absolute bottom-24 lg:bottom-8 left-1/2 lg:left-auto lg:right-8 -translate-x-1/2 lg:translate-x-0 z-[1000] w-full lg:w-auto px-10 lg:px-0">
      <button
        className="w-full lg:px-10 h-14 rounded-full border-2 text-sm font-bold uppercase tracking-widest transition-all active:scale-95"
        style={{
          borderColor: theme.colors.primary,
          color: theme.colors.primary,
          background: "rgba(0,0,0,0.8)",
          boxShadow: theme.shadow.neon,
          backdropFilter: "blur(8px)"
        }}
      >
        {count > 0 ? `Ver ${count} locais próximos` : "Buscando locais..."}
      </button>
    </div>
  );
}