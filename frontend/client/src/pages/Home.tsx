import { useMemo, useState } from "react";
import { useLocation, Link } from "wouter";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme"; // Importando seus tokens de tema
import { cn } from "@/lib/utils";
import { getLoginUrl } from "@/const";

import LeafletMap from "@/components/LeafletMap";
import { Button } from "@/components/ui/button";

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
  CheckCircle,
  Trophy,
  LogOut
} from "lucide-react";

/* ================================================== */
/* CONFIGURAÇÕES E CONSTANTES */
/* ================================================== */

const NAV_ITEMS = [
  { href: "/checkin", icon: CheckCircle, label: "Check-in" },
  { href: "/search", icon: Search, label: "Buscar" },
  { href: "/", icon: MapPin, label: "Mapa" },
  { href: "/ranking", icon: Trophy, label: "Ranking" },
  { href: "/profile", icon: User, label: "Perfil" },
];

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

  const { data: topPlaces } = trpc.places.topPlaces.useQuery({ limit: 20 });

  // Lógica de Filtro Unificada
  const filteredPlaces = useMemo(() => {
    if (!topPlaces) return [];
    return topPlaces.filter((place) => {
      const matchesSearch = 
        place.name.toLowerCase().includes(search.toLowerCase()) ||
        place.address.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = 
        activeFilter === "Todos" || 
        place.category?.toLowerCase() === activeFilter.toLowerCase();

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
      <DesktopSidebar 
        user={user} 
        isAuthenticated={isAuthenticated} 
        logout={logout} 
        location={location} 
      />

      {/* 2. CONTEÚDO PRINCIPAL (MAPA + OVERLAYS) */}
      <main className="flex-1 relative h-full">
        
        {/* MAPA (Fundo) */}
        <LeafletMap
          places={mapPlaces}
          onPlaceClick={(place) => setLocation(`/details/${place.id}`)}
          showUserLocation
          className="absolute inset-0 z-0"
        />

        {/* OVERLAY SUAVE DO MAPA */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-black/20" />

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
        <BottomNav location={location} />
      </main>
    </div>
  );
}

/* ================================================== */
/* COMPONENTES DE NAVEGAÇÃO */
/* ================================================== */

// SIDEBAR DESKTOP
export function DesktopSidebar({ user, isAuthenticated, logout, location }: any) {
  return (
    <aside 
      className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-r z-[1001]"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
    >
      {/* Logo Section */}
      <div className="px-8 py-10 border-b" style={{ borderColor: theme.colors.borderSoft }}>
        <Link href="/" className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00FF66]/20 blur-lg rounded-full" />
            <img src="/logo-icon.png" alt="Logo" className="w-10 h-10 object-contain relative z-10 drop-shadow-[0_0_8px_#00FF66]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter">
            <span className="text-white">Join</span>
            <span style={{ color: theme.colors.primary }}>Me</span>
          </h1>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all group",
                isActive ? "shadow-lg" : "hover:bg-white/5"
              )}
              style={{
                backgroundColor: isActive ? `${theme.colors.primary}15` : "transparent",
                color: isActive ? theme.colors.primary : theme.colors.textSoft,
                border: isActive ? `1px solid ${theme.colors.primary}30` : "1px solid transparent"
              }}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="group-hover:scale-110 transition-transform" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="px-6 py-8 border-t" style={{ borderColor: theme.colors.borderSoft }}>
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0B0B0B] border border-[#27272a] flex items-center justify-center">
              <User size={20} style={{ color: theme.colors.primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.username || "Usuário"}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Membro</p>
            </div>
            <button onClick={() => logout()} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Button 
            className="w-full h-12 rounded-xl font-bold uppercase tracking-widest"
            style={{ backgroundColor: theme.colors.primary, color: "black", boxShadow: theme.shadow.neon }}
            onClick={() => window.location.href = getLoginUrl()}
          >
            Entrar
          </Button>
        )}
      </div>
    </aside>
  );
}

// BOTTOM NAV MOBILE
export function BottomNav({ location }: { location: string }) {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-area-bottom border-t"
      style={{ backgroundColor: `${theme.colors.surface}F2`, borderColor: theme.colors.border, backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="relative flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all active:scale-90">
              <div 
                className={cn("p-1.5 rounded-xl transition-all", isActive && "bg-[#00FF66]/10")}
                style={{ boxShadow: isActive ? theme.shadow.neon : "none", color: isActive ? theme.colors.primary : theme.colors.textMuted }}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: isActive ? theme.colors.primary : theme.colors.textMuted }}>
                {item.label}
              </span>
              {isActive && <div className="absolute -bottom-1 w-6 h-0.5 rounded-full" style={{ backgroundColor: theme.colors.primary, boxShadow: `0 0 8px ${theme.colors.primary}` }} />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ================================================== */
/* COMPONENTES DE UI AUXILIARES */
/* ================================================== */

function MobileHeader({ user, isAuthenticated, onProfile, onLogin }: any) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <img src="/logo-icon.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_#00FF66]" />
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
