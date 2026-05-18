/**
 * @file Details.tsx
 * @description Página de detalhes de um local específico.
 * Exibe informações completas do local: nome, endereço, categoria, estatísticas
 * (check-ins, avaliação média) e lista de avaliações de usuários.
 * Também oferece ações de check-in e navegação para o mapa.
 */

import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, Clock, CheckCircle, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageCard } from "@/components/PageCard";
import { CategoryBadge } from "@/components/CategoryBadge";
import { StatCard } from "@/components/StatCard";
import { StarRating } from "@/components/StarRating";

/* ================================================== */
/* PÁGINA PRINCIPAL */
/* ================================================== */

/**
 * @component Details
 * @description Página de detalhes de um local. Busca os dados do local pelo ID
 * da URL e exibe informações detalhadas, estatísticas e avaliações.
 */
export default function Details() {
  const [, params] = useRoute("/details/:id");
  const [, setLocation] = useLocation();

  const placeId = params?.id ? parseInt(params.id, 10) : 0;

  /* Busca os dados do local pelo ID via tRPC */
  const { data: place, isLoading: placeLoading } = trpc.places.getById.useQuery(
    { id: placeId },
    { enabled: placeId > 0 }
  );

  /* Busca os check-ins (avaliações) do local */
  const { data: checkinsList } = trpc.checkins.byPlace.useQuery(
    { placeId, limit: 20 },
    { enabled: placeId > 0 }
  );

  const handleBack = () => setLocation("/");

  /* Estado de carregamento: exibe skeleton enquanto os dados chegam */
  if (placeLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <HeaderSkeleton />
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  /* Estado de erro: local não encontrado */
  if (!place) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: theme.colors.surface }}
        >
          <MapPin size={30} style={{ color: theme.colors.textMuted }} />
        </div>
        <p className="text-sm" style={{ color: theme.colors.textMuted }}>
          Local não encontrado
        </p>
        <Button className="mt-4" onClick={handleBack}>
          Voltar ao mapa
        </Button>
      </div>
    );
  }

  const avgRating = Number(place.avgRating ?? 0);
  const totalCheckins = Number(place.totalCheckins ?? 0);

  return (
    <div
      className="flex-1 flex flex-col"
      style={{ background: theme.colors.background, color: theme.colors.text }}
    >
      {/* Cabeçalho com botão de voltar — usa PageHeader centralizado */}
      <PageHeader title={place.name} onBack={handleBack} />

      <div className="flex-1 overflow-y-auto">
        {/* Seção de informações principais do local */}
        <div className="p-4">
          <PageCard padding="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <h2 className="text-xl font-bold">{place.name}</h2>
                <div
                  className="flex items-center gap-1.5 mt-1 text-sm"
                  style={{ color: theme.colors.textMuted }}
                >
                  <MapPin size={14} style={{ color: theme.colors.primary }} />
                  <span>{place.address}</span>
                </div>
              </div>

              {/* Badge de categoria — usa CategoryBadge centralizado */}
              {place.category && place.category !== "general" && (
                <CategoryBadge>{place.category}</CategoryBadge>
              )}
            </div>

            {/* Descrição do local, exibida apenas se existir */}
            {place.description && (
              <p
                className="text-sm leading-relaxed"
                style={{ color: theme.colors.textMuted }}
              >
                {place.description}
              </p>
            )}

            {/* Estatísticas: avaliação média e total de check-ins — usa StatCard centralizado */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <StatCard
                icon={<Star size={16} className="fill-yellow-500 text-yellow-500" />}
                value={avgRating > 0 ? avgRating.toFixed(1) : "—"}
                label="Avaliação média"
              />
              <StatCard
                icon={<CheckCircle size={16} style={{ color: theme.colors.primary }} />}
                value={totalCheckins}
                label="Check-ins"
              />
            </div>

            {/* Botão de ação principal: fazer check-in */}
            <Button
              className="w-full h-14 mt-4 rounded-xl font-semibold"
              style={{
                background: theme.colors.primary,
                color: theme.colors.background,
                boxShadow: theme.shadow.neon,
              }}
              onClick={() => setLocation(`/checkin/${placeId}`)}
            >
              <CheckCircle size={16} className="mr-2" />
              Fazer Check-in
            </Button>
          </PageCard>
        </div>

        {/* Seção de avaliações dos usuários */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold mb-3">
            Avaliações recentes ({checkinsList?.length ?? 0})
          </h3>

          {/* Estado vazio: nenhuma avaliação ainda */}
          {(!checkinsList || checkinsList.length === 0) && (
            <PageCard padding="p-6" className="text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: theme.colors.surfaceSoft }}
              >
                <Users size={24} style={{ color: theme.colors.textMuted }} />
              </div>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                Nenhuma avaliação ainda. Seja o primeiro!
              </p>
            </PageCard>
          )}

          {/* Lista de avaliações */}
          {checkinsList && checkinsList.length > 0 && (
            <div className="space-y-2">
              {checkinsList.map((ci) => (
                <ReviewCard key={ci.id} review={ci} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================== */
/* COMPONENTES INTERNOS */
/* ================================================== */

/**
 * @component HeaderSkeleton
 * @description Skeleton de carregamento para o cabeçalho da página.
 * Exibido enquanto os dados do local estão sendo carregados.
 */
function HeaderSkeleton() {
  return (
    <header className="px-4 py-3 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="h-5 w-40" />
    </header>
  );
}

/**
 * @component ReviewCard
 * @description Card de avaliação individual de um usuário.
 * Exibe nome do usuário, estrelas, comentário, ocupação e data.
 *
 * @param review - Objeto com os dados da avaliação (check-in)
 */
function ReviewCard({ review }: any) {
  /* Mapeamento de valores de ocupação para rótulos em português */
  const occupancyLabels: Record<string, string> = {
    empty: "Vazio",
    moderate: "Moderado",
    full: "Cheio",
  };

  return (
    <PageCard padding="p-3">
      <div className="flex items-center justify-between mb-1.5">
        {/* Nome do usuário ou "Anônimo" se não disponível */}
        <span className="text-sm font-medium">{review.userName ?? "Anônimo"}</span>

        {/* Estrelas de avaliação em modo somente leitura — usa StarRating centralizado */}
        <StarRating rating={review.rating} size={12} />
      </div>

      {/* Comentário da avaliação, exibido apenas se existir */}
      {review.comment && (
        <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>
          {review.comment}
        </p>
      )}

      {/* Rodapé: badge de ocupação e data */}
      <div className="flex items-center gap-3 mt-2">
        {review.occupancy && (
          <CategoryBadge>
            {occupancyLabels[review.occupancy] ?? review.occupancy}
          </CategoryBadge>
        )}
        <span
          className="text-[10px] flex items-center gap-1"
          style={{ color: theme.colors.textMuted }}
        >
          <Clock size={10} />
          {new Date(review.createdAt).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </PageCard>
  );
}
