/**
 * @file CheckIn.tsx
 * @description Página de check-in em um local.
 * Permite ao usuário registrar sua presença em um local, fornecendo
 * uma avaliação (1-5 estrelas), comentário e nível de ocupação.
 *
 * Fluxo em dois passos:
 * 1. Seleção do local — ordenado por distância do usuário (se geolocalização disponível)
 * 2. Preenchimento da avaliação (nota, comentário, ocupação)
 *
 * Geolocalização:
 * - Solicita permissão ao carregar a página
 * - Se concedida: usa trpc.places.nearby (ordenado por distância real)
 * - Se negada/indisponível: usa trpc.places.topPlaces como fallback
 *
 * Endpoints utilizados:
 * - trpc.places.nearby    → locais próximos ordenados por distância (requer lat/lng)
 * - trpc.places.topPlaces → fallback quando geolocalização não está disponível
 * - trpc.places.getById   → busca local pré-selecionado via URL (/checkin/:id)
 * - trpc.checkins.create  → registra o check-in
 */

import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LoadingState } from "@/components/LoadingState";
import { PageCard } from "@/components/PageCard";
import { PageCenter } from "@/components/PageCenter";
import { StarRating } from "@/components/StarRating";

/* ================================================== */
/* TIPOS */
/* ================================================== */

/** Coordenadas geográficas do usuário */
type Coords = { lat: number; lng: number } | null;

/** Status da solicitação de geolocalização */
type GeoStatus = "pending" | "granted" | "denied" | "unavailable";

/* ================================================== */
/* PÁGINA PRINCIPAL */
/* ================================================== */

/**
 * @component CheckIn
 * @description Página de check-in com fluxo de dois passos.
 * Solicita geolocalização ao carregar para ordenar locais por distância.
 */
export default function CheckIn() {
  const [, params] = useRoute("/checkin/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  /* Estado do fluxo de check-in */
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [occupancy, setOccupancy] = useState<"empty" | "moderate" | "full" | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  /* Estado da geolocalização do usuário */
  const [coords, setCoords] = useState<Coords>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("pending");

  /*
   * Solicita a geolocalização do usuário ao montar o componente.
   * A permissão é solicitada apenas uma vez; o resultado é armazenado em estado.
   */
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
      },
      () => {
        setGeoStatus("denied");
      },
      { timeout: 8000, maximumAge: 60_000 }
    );
  }, []);

  /*
   * Busca locais próximos ordenados por distância quando a geolocalização está disponível.
   * Raio de 10km, limite de 50 locais. O campo `distance` (km) vem do servidor.
   */
  const { data: nearbyPlaces, isLoading: nearbyLoading } = trpc.places.nearby.useQuery(
    { lat: coords?.lat ?? 0, lng: coords?.lng ?? 0, radiusKm: 10, limit: 50 },
    { enabled: geoStatus === "granted" && coords !== null }
  );

  /*
   * Fallback: lista os locais mais populares quando a geolocalização não está disponível.
   * Só ativa quando a geolocalização foi negada ou não está disponível no navegador.
   */
  const { data: topPlaces, isLoading: topLoading } = trpc.places.topPlaces.useQuery(
    { limit: 50 },
    { enabled: geoStatus === "denied" || geoStatus === "unavailable" }
  );

  /* Busca o local pré-selecionado via URL (ex: /checkin/42) */
  const placeId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: preselectedPlace } = trpc.places.getById.useQuery(
    { id: placeId },
    { enabled: placeId > 0 }
  );

  /* Mutation para registrar o check-in via tRPC */
  const checkinMutation = trpc.checkins.create.useMutation();

  /*
   * Seleciona a lista de locais a exibir:
   * - Locais próximos (ordenados por distância) quando geolocalização disponível
   * - Locais populares como fallback
   */
  const places = geoStatus === "granted" ? (nearbyPlaces ?? []) : (topPlaces ?? []);
  const placesLoading =
    geoStatus === "pending" ||
    (geoStatus === "granted" && nearbyLoading) ||
    ((geoStatus === "denied" || geoStatus === "unavailable") && topLoading);

  /* Define o local selecionado: via URL ou via seleção manual */
  const activePlace = selectedPlace ?? preselectedPlace ?? null;

  /* Redireciona para login se o usuário não estiver autenticado */
  if (!isAuthenticated) {
    return (
      <PageCenter>
        <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
          Você precisa estar logado para fazer check-in.
        </p>
        <Button
          onClick={() => setLocation("/login")}
          style={{ background: theme.colors.primary, color: theme.colors.background }}
        >
          Entrar
        </Button>
      </PageCenter>
    );
  }

  /* Estado de sucesso: check-in realizado com sucesso */
  if (done) {
    return (
      <PageCenter>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: theme.colors.primary }}
        >
          <MapPin size={30} style={{ color: theme.colors.background }} />
        </div>
        <h2 className="text-xl font-bold mb-2">Check-in realizado!</h2>
        <p className="text-sm mb-6" style={{ color: theme.colors.textMuted }}>
          Obrigado pela sua avaliação.
        </p>
        <Button
          className="w-full h-12 rounded-xl"
          style={{ background: theme.colors.primary, color: theme.colors.background }}
          onClick={() => setLocation("/")}
        >
          Voltar ao mapa
        </Button>
      </PageCenter>
    );
  }

  /**
   * @function handleSubmit
   * @description Envia o check-in para o servidor via tRPC.
   * Valida se um local foi selecionado antes de enviar.
   */
  async function handleSubmit() {
    if (!activePlace) return;
    setLoading(true);
    try {
      await checkinMutation.mutateAsync({
        placeId: activePlace.id,
        rating,
        comment: comment || undefined,
        occupancy: occupancy ?? undefined,
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex-1 min-h-screen flex flex-col"
      style={{ background: theme.colors.background, color: theme.colors.text }}
    >
      {/* Cabeçalho com botão de voltar */}
      <PageHeader title="Check-in" onBack={() => setLocation("/")} />

      <div className="flex-1 overflow-y-auto p-4">
        {/* Passo 1: Seleção do local */}
        {!activePlace ? (
          placesLoading ? (
            <LoadingState message="Buscando locais próximos..." />
          ) : (
            <PlaceSelectionStep
              places={places}
              geoStatus={geoStatus}
              userCoords={coords}
              onSelect={setSelectedPlace}
            />
          )
        ) : (
          /* Passo 2: Preenchimento da avaliação */
          <ReviewStep
            selectedPlace={activePlace}
            rating={rating}
            setRating={setRating}
            comment={comment}
            setComment={setComment}
            occupancy={occupancy}
            setOccupancy={setOccupancy}
            onChangePlace={() => setSelectedPlace(null)}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

/* ================================================== */
/* PASSO 1: SELEÇÃO DO LOCAL */
/* ================================================== */

/**
 * @component PlaceSelectionStep
 * @description Primeiro passo do check-in: lista de locais para seleção.
 * Quando a geolocalização está disponível, exibe a distância de cada local
 * e ordena do mais próximo ao mais distante.
 * Quando não está disponível, exibe os locais mais populares com aviso.
 *
 * @param places      - Lista de locais (já ordenada por distância ou popularidade)
 * @param geoStatus   - Status atual da geolocalização
 * @param userCoords  - Coordenadas do usuário (null se não disponível)
 * @param onSelect    - Função chamada ao selecionar um local
 */
function PlaceSelectionStep({
  places,
  geoStatus,
  onSelect,
}: {
  places: any[];
  geoStatus: GeoStatus;
  userCoords: Coords;
  onSelect: (p: any) => void;
}) {
  return (
    <div>
      {/* Cabeçalho com indicador de modo de ordenação */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Selecione o local</h2>

        {/* Badge indicando se a ordenação é por distância ou popularidade */}
        <div
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{
            background: geoStatus === "granted"
              ? theme.colors.primary + "22"
              : theme.colors.surfaceSoft,
            color: geoStatus === "granted"
              ? theme.colors.primary
              : theme.colors.textMuted,
          }}
        >
          {geoStatus === "granted" ? (
            <>
              <Navigation size={11} />
              Por distância
            </>
          ) : geoStatus === "pending" ? (
            <>
              <Loader2 size={11} className="animate-spin" />
              Localizando...
            </>
          ) : (
            <>
              <MapPin size={11} />
              Mais populares
            </>
          )}
        </div>
      </div>

      {/* Lista de locais */}
      {places.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: theme.colors.textMuted }}>
          Nenhum local encontrado nas proximidades.
        </p>
      ) : (
        <div className="space-y-2">
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              showDistance={geoStatus === "granted"}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * @component PlaceCard
 * @description Card de local na lista de seleção do check-in.
 * Exibe nome, endereço e, quando disponível, a distância em km ou metros.
 *
 * @param place        - Dados do local (inclui campo `distance` quando vem de nearby)
 * @param showDistance - Se true, exibe a distância calculada pelo servidor
 * @param onSelect     - Função chamada ao clicar no card
 */
function PlaceCard({
  place,
  showDistance,
  onSelect,
}: {
  place: any;
  showDistance: boolean;
  onSelect: (p: any) => void;
}) {
  /**
   * @function formatDistance
   * @description Formata a distância em metros (< 1km) ou quilômetros.
   * O campo `distance` vem em km do servidor (fórmula de Haversine).
   */
  function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  }

  return (
    <button
      onClick={() => onSelect(place)}
      className="w-full text-left rounded-xl border p-3 transition active:scale-[0.98]"
      style={{
        background: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Informações do local */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{place.name}</p>
          <div
            className="flex items-center gap-1 text-xs mt-1"
            style={{ color: theme.colors.textMuted }}
          >
            <MapPin size={11} />
            <span className="truncate">{place.address}</span>
          </div>
        </div>

        {/* Distância — exibida apenas quando geolocalização disponível */}
        {showDistance && place.distance != null && (
          <div
            className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
            style={{
              background: theme.colors.primary + "18",
              color: theme.colors.primary,
            }}
          >
            <Navigation size={11} />
            {formatDistance(Number(place.distance))}
          </div>
        )}
      </div>
    </button>
  );
}

/* ================================================== */
/* PASSO 2: AVALIAÇÃO */
/* ================================================== */

/**
 * @component ReviewStep
 * @description Segundo passo do check-in: formulário de avaliação.
 * Permite ao usuário dar uma nota (1-5 estrelas), escrever um comentário
 * e indicar o nível de ocupação do local.
 */
function ReviewStep({
  selectedPlace,
  rating,
  setRating,
  comment,
  setComment,
  occupancy,
  setOccupancy,
  onChangePlace,
  onSubmit,
  loading,
}: any) {
  return (
    <div className="space-y-6">
      {/* Card com informações do local selecionado */}
      <PageCard>
        <p className="font-semibold">{selectedPlace.name}</p>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          {selectedPlace.address}
        </p>
        {/* Link para trocar o local selecionado */}
        <button
          onClick={onChangePlace}
          className="text-sm mt-3"
          style={{ color: theme.colors.primary }}
        >
          Trocar local
        </button>
      </PageCard>

      {/* Campo de avaliação por estrelas — usa StarRating centralizado */}
      <div>
        <Label className="mb-3 block">Avaliação</Label>
        <div className="flex justify-center">
          <StarRating rating={rating} onRate={setRating} size={34} />
        </div>
      </div>

      {/* Campo de comentário opcional */}
      <div>
        <Label className="mb-2 block">Comentário</Label>
        <Textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Compartilhe sua experiência..."
        />
      </div>

      {/* Campo de ocupação */}
      <div>
        <Label className="mb-2 block">Ocupação</Label>
        <RadioGroup
          value={occupancy ?? ""}
          onValueChange={(v) => setOccupancy(v as any)}
        >
          <OccupancyOption value="empty" label="Vazio" />
          <OccupancyOption value="moderate" label="Moderado" />
          <OccupancyOption value="full" label="Cheio" />
        </RadioGroup>
      </div>

      {/* Botão de confirmação do check-in */}
      <Button
        className="w-full h-14 rounded-xl font-semibold transition-all duration-200"
        style={{
          background: loading ? theme.colors.border : theme.colors.primary,
          color: loading ? theme.colors.textMuted : theme.colors.background,
        }}
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? "Enviando..." : "Confirmar Check-in"}
      </Button>
    </div>
  );
}

/* ================================================== */
/* COMPONENTES AUXILIARES */
/* ================================================== */

/**
 * @component OccupancyOption
 * @description Opção de radio button para seleção de ocupação do local.
 *
 * @param value - Valor da opção (empty, moderate, full)
 * @param label - Rótulo exibido ao usuário
 */
function OccupancyOption({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem value={value} id={value} />
      <Label htmlFor={value}>{label}</Label>
    </div>
  );
}
