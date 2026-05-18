/**
 * @file CheckIn.tsx
 * @description Página de check-in em um local.
 * Permite ao usuário registrar sua presença em um local, fornecendo
 * uma avaliação (1-5 estrelas), comentário e nível de ocupação.
 * O fluxo é dividido em dois passos: seleção do local e preenchimento da avaliação.
 */

import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LoadingState } from "@/components/LoadingState";
import { PageCard } from "@/components/PageCard";
import { PageCenter } from "@/components/PageCenter";
import { StarRating } from "@/components/StarRating";

/* ================================================== */
/* PÁGINA PRINCIPAL */
/* ================================================== */

/**
 * @component CheckIn
 * @description Página de check-in com fluxo de dois passos.
 * Passo 1: Seleção do local (se não vier pela URL).
 * Passo 2: Preenchimento de avaliação, comentário e ocupação.
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

  /* Busca os locais disponíveis para seleção */
  const { data: places, isLoading: placesLoading } = trpc.places.topPlaces.useQuery({ limit: 50 });

  /* Busca o local pré-selecionado via URL (ex: /checkin/42) */
  const placeId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: preselectedPlace } = trpc.places.getById.useQuery(
    { id: placeId },
    { enabled: placeId > 0 }
  );

  /* Define o local selecionado: via URL ou via seleção manual */
  const activePlace = selectedPlace ?? preselectedPlace ?? null;

  /* Mutation para registrar o check-in via tRPC */
  const checkinMutation = trpc.checkins.create.useMutation();

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
      {/* Cabeçalho com botão de voltar — usa PageHeader centralizado */}
      <PageHeader title="Check-in" onBack={() => setLocation("/")} />

      <div className="flex-1 overflow-y-auto p-4">
        {/* Passo 1: Seleção do local */}
        {!activePlace ? (
          placesLoading ? (
            <LoadingState />
          ) : (
            <PlaceSelectionStep places={places ?? []} onSelect={setSelectedPlace} />
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
 * @description Primeiro passo do check-in: lista de locais disponíveis para seleção.
 * Permite ao usuário escolher em qual local deseja fazer check-in.
 *
 * @param places - Lista de locais disponíveis
 * @param onSelect - Função chamada ao selecionar um local
 */
function PlaceSelectionStep({ places, onSelect }: { places: any[]; onSelect: (p: any) => void }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Selecione o local</h2>
      <div className="space-y-2">
        {places.map((place) => (
          <button
            key={place.id}
            onClick={() => onSelect(place)}
            className="w-full text-left rounded-xl border p-3 transition"
            style={{
              background: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            <p className="font-semibold">{place.name}</p>
            <div
              className="flex items-center gap-1 text-xs mt-1"
              style={{ color: theme.colors.textMuted }}
            >
              <MapPin size={12} />
              {place.address}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================== */
/* PASSO 2: AVALIAÇÃO */
/* ================================================== */

/**
 * @component ReviewStep
 * @description Segundo passo do check-in: formulário de avaliação.
 * Permite ao usuário dar uma nota, escrever um comentário e indicar a ocupação.
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

      {/* Campo de comentário */}
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
