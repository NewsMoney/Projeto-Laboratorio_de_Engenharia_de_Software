/**
 * @file MapPage.tsx
 * @description Página de mapa completo em tela cheia.
 * Exibe o mapa Leaflet com todos os locais cadastrados como marcadores.
 * Ao clicar em um marcador, exibe um painel inferior com informações do local
 * e opções de navegação para detalhes e check-in.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import LeafletMap from "@/components/LeafletMap";
import { CategoryBadge } from "@/components/CategoryBadge";

/* ================================================== */
/* PÁGINA PRINCIPAL */
/* ================================================== */

/**
 * @component MapPage
 * @description Página de mapa em tela cheia com painel de detalhes do local selecionado.
 * Ao clicar em um marcador, exibe um painel deslizante na parte inferior com
 * informações do local e botões de ação.
 */
export default function MapPage() {
  const [, setLocation] = useLocation();
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  /* Busca todos os locais disponíveis para exibir no mapa */
  const { data: places } = trpc.places.topPlaces.useQuery({ limit: 200 });

  return (
    <div className="fixed inset-0" style={{ background: theme.colors.background }}>
      {/* Mapa em tela cheia */}
      <LeafletMap
        places={places ?? []}
        onPlaceClick={setSelectedPlace}
        showUserLocation
        className="absolute inset-0 z-0"
      />

      {/* Painel inferior: exibido ao selecionar um local no mapa */}
      {selectedPlace && (
        <PlacePanel
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onDetails={() => setLocation(`/details/${selectedPlace.id}`)}
          onCheckin={() => setLocation(`/checkin/${selectedPlace.id}`)}
        />
      )}
    </div>
  );
}

/* ================================================== */
/* COMPONENTES INTERNOS */
/* ================================================== */

/**
 * @component PlacePanel
 * @description Painel deslizante exibido na parte inferior ao selecionar um local.
 * Contém nome, endereço, categoria e botões de ação (detalhes e check-in).
 *
 * @param place - Dados do local selecionado
 * @param onClose - Função chamada ao fechar o painel
 * @param onDetails - Função chamada ao clicar em "Ver detalhes"
 * @param onCheckin - Função chamada ao clicar em "Check-in"
 */
function PlacePanel({
  place,
  onClose,
  onDetails,
  onCheckin,
}: {
  place: any;
  onClose: () => void;
  onDetails: () => void;
  onCheckin: () => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4">
      <div
        className="rounded-2xl p-4"
        style={{
          background: theme.colors.surface,
          borderColor: theme.colors.border,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        {/* Cabeçalho do painel: nome, categoria e botão fechar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{place.name}</h3>
            <p className="text-sm mt-0.5 truncate" style={{ color: theme.colors.textMuted }}>
              {place.address}
            </p>

            {/* Badge de categoria — usa CategoryBadge centralizado */}
            {place.category && place.category !== "general" && (
              <CategoryBadge className="mt-2">{place.category}</CategoryBadge>
            )}
          </div>

          {/* Botão de fechar o painel */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: theme.colors.surfaceSoft }}
            aria-label="Fechar painel"
          >
            <X size={16} style={{ color: theme.colors.textMuted }} />
          </button>
        </div>

        {/* Botões de ação: ver detalhes e fazer check-in */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button
            className="h-11 rounded-xl font-semibold"
            style={{
              background: theme.colors.primary,
              color: theme.colors.background,
              boxShadow: theme.shadow.neon,
            }}
            onClick={onDetails}
          >
            Ver detalhes
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-xl font-semibold"
            style={{
              borderColor: theme.colors.primary,
              color: theme.colors.primary,
              background: "transparent",
            }}
            onClick={onCheckin}
          >
            Check-in
          </Button>
        </div>
      </div>
    </div>
  );
}
