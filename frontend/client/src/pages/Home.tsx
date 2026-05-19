import { useMemo, useState } from "react";
import { useLocation } from "wouter";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";
import { useIsMobile } from "@/hooks/useMobile";

import LeafletMap from "@/components/LeafletMap";
import { DesktopSidebar } from "../components/DesktopUI";

import { 
  BottomNav, 
  MobileHeader,
} from "@/components/MobileUI";

import { 
  SearchBar, 
  FilterTabs, 
  NearbyButton
} from "@/components/SerchUI";

/**
 * @function Home
 * @description Componente principal da página inicial. Gerencia o mapa, buscas, filtros
 *              e alterna entre as interfaces Desktop e Mobile usando o hook useIsMobile.
 */
export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  
  // hook de detecção de mobile
  const isMobile = useIsMobile();

  // Busca de dados via tRPC
  const { data: topPlaces } = trpc.places.topPlaces.useQuery({ limit: 50 });

  /**
   * Lógica de Filtro Unificada: Filtra por nome/endereço e categoria.
   */
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

  const mapPlaces = useMemo(() => filteredPlaces.map((p) => ({ ...p })), [filteredPlaces]);

  return (
    <div 
      className="fixed inset-0 flex flex-col md:flex-row overflow-hidden select-none" 
      style={{ background: theme.colors.background }}
    >
      {/* 1. SIDEBAR (Apenas Desktop - acima de 1024px) */}
      {!isMobile && <DesktopSidebar />}

      {/* 2. CONTEÚDO PRINCIPAL (MAPA + OVERLAYS) */}
      <main className="flex-1 relative h-full">
        
        {/* MAPA (Sempre presente no fundo) */}
        <LeafletMap
          places={mapPlaces}
          onPlaceClick={(place) => setLocation(`/details/${place.id}`)}
          showUserLocation
          className="absolute inset-0 z-0"
        />

        {/* INTERFACE MOBILE: Renderizada apenas se isMobile for true */}
        {isMobile ? (
          <>
            <div className="relative z-[1000] px-5 pt-6 pb-2 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
              <MobileHeader
                isAuthenticated={isAuthenticated}
                onProfile={() => setLocation("/profile")}
                onLogin={() => setLocation("/login")}
              />

              <SearchBar 
                value={search} 
                onChange={setSearch} 
                onClear={() => setSearch("")} 
              />

              <FilterTabs 
                activeFilter={activeFilter} 
                onSelect={setActiveFilter} 
              />
            </div>
            
            {/* Navegação Inferior Mobile */}
            <BottomNav />
          </>
        ) : (
          /* INTERFACE DESKTOP: Renderizada apenas se isMobile for false */
          <div className="absolute top-8 left-8 z-[1000] w-96">
             <SearchBar 
               value={search} 
               onChange={setSearch} 
               onClear={() => setSearch("")} 
             />
          </div>
        )}

        {/* CTA FLUTUANTE: Visível em ambos, o componente NearbyButton 
            deve lidar com o posicionamento interno (ex: bottom-24 no mobile, bottom-8 no desktop) */}
        <NearbyButton count={filteredPlaces.length} />
      </main>
    </div>
  );
}
