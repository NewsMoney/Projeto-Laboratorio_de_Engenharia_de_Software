/**
 * @file Ranking.tsx
 * @description Página de ranking dos locais mais visitados.
 * Exibe uma lista ordenada de locais com base no número de check-ins
 * e avaliação média, permitindo ao usuário navegar para os detalhes de cada local.
 */

import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";
import { MapPin, Star } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";

/* ================================================== */
/* PÁGINA PRINCIPAL */
/* ================================================== */

/**
 * @component Ranking
 * @description Página de ranking que lista os locais mais populares.
 * Usa os componentes centralizados PageHeader, LoadingState e EmptyState.
 */
export default function Ranking() {
  const [, setLocation] = useLocation();

  /* Busca os locais mais visitados via tRPC */
  const { data: topPlaces, isLoading: placesLoading } = trpc.places.topPlaces.useQuery({ limit: 50 });

  return (
    <div
      className="flex-1 min-h-screen flex flex-col"
      style={{ background: theme.colors.background, color: theme.colors.text }}
    >
      {/* Cabeçalho com botão de voltar — usa PageHeader centralizado */}
      <PageHeader title="Ranking de Locais" onBack={() => setLocation("/")} />

      {/* Conteúdo principal com scroll */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Estado de carregamento — usa LoadingState centralizado */}
        {placesLoading ? (
          <LoadingState />
        ) : !topPlaces || topPlaces.length === 0 ? (
          /* Estado vazio — usa EmptyState centralizado */
          <EmptyState
            message="Nenhum local com check-ins ainda"
            subMessage="Explore o mapa e faça check-ins"
          />
        ) : (
          /* Lista de locais ranqueados */
          <div className="space-y-2">
            {topPlaces.map((place, index) => (
              <RankCard
                key={place.id}
                place={place}
                index={index}
                onOpen={() => setLocation(`/details/${place.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================== */
/* COMPONENTES INTERNOS */
/* ================================================== */

/**
 * @component RankCard
 * @description Card de um local no ranking.
 * Exibe a posição, nome, endereço, número de check-ins e avaliação média.
 *
 * @param place - Dados do local
 * @param index - Posição no ranking (0-based)
 * @param onOpen - Função chamada ao clicar para ver detalhes
 */
function RankCard({ place, index, onOpen }: any) {
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-xl border p-3.5 flex items-center gap-3 text-left transition"
      style={{
        background: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      {/* Posição no ranking */}
      <div
        className="w-8 text-center text-sm font-bold"
        style={{ color: theme.colors.primary }}
      >
        #{index + 1}
      </div>

      {/* Ícone do local */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: theme.colors.surfaceSoft }}
      >
        <MapPin size={18} style={{ color: theme.colors.primary }} />
      </div>

      {/* Informações do local */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{place.name}</p>
        <p className="text-xs" style={{ color: theme.colors.textMuted }}>
          {Number(place.checkinCount)} check-ins
        </p>
      </div>

      {/* Avaliação média, exibida apenas se existir */}
      <div className="text-right min-w-[48px]">
        {Number(place.avgRating) > 0 && (
          <div className="flex items-center justify-end gap-1">
            <Star size={12} className="fill-yellow-500 text-yellow-500" />
            <span className="text-xs font-semibold">
              {Number(place.avgRating).toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
