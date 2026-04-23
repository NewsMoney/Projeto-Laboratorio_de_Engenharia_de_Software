import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { theme } from "@/lib/theme";

import {
  ArrowLeft,
  Search,
  Star,
  MapPin,
  Loader2,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/* ================================================== */
/* CHECK IN */
/* ================================================== */

export default function CheckIn() {
  const [, setLocation] =
    useLocation();

  const { isAuthenticated } =
    useAuth();

  const [step, setStep] =
    useState<
      "select" | "review"
    >("select");

  const [coords, setCoords] =
    useState<{
      lat: number;
      lng: number;
    } | null>(null);

  const [search, setSearch] =
    useState("");

  const [
    selectedPlace,
    setSelectedPlace,
  ] = useState<any>(null);

  const [rating, setRating] =
    useState(0);

  const [comment, setComment] =
    useState("");

  const [
    occupancy,
    setOccupancy,
  ] = useState<
    | "empty"
    | "moderate"
    | "full"
    | undefined
  >();

  const [submitted, setSubmitted] =
    useState(false);

  /* ---------------------------------- */
  /* AUTH */
  /* ---------------------------------- */

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [
    isAuthenticated,
    setLocation,
  ]);

  /* ---------------------------------- */
  /* GEOLOCATION */
  /* ---------------------------------- */

  useEffect(() => {
    if (!isAuthenticated)
      return;

    const fallback = {
      lat: -23.5505,
      lng: -46.6333,
    };

    if (
      !(
        "geolocation" in
        navigator
      )
    ) {
      setCoords(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords
            .latitude,
          lng: pos.coords
            .longitude,
        });
      },
      () =>
        setCoords(fallback),
      { timeout: 5000 }
    );
  }, [isAuthenticated]);

  /* ---------------------------------- */
  /* QUERY */
  /* ---------------------------------- */

  const {
    data: places,
    isLoading,
  } =
    trpc.places.nearby.useQuery(
      {
        lat:
          coords?.lat ??
          -23.5505,
        lng:
          coords?.lng ??
          -46.6333,
        limit: 20,
      },
      {
        enabled:
          !!coords &&
          isAuthenticated,
      }
    );

  const filteredPlaces =
    useMemo(() => {
      if (!places) return [];

      if (!search.trim())
        return places;

      return places.filter(
        (p) =>
          p.name
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [places, search]);

  const utils =
    trpc.useUtils();

  const checkinMutation =
    trpc.checkins.create.useMutation(
      {
        onSuccess: () => {
          setSubmitted(true);

          toast.success(
            "Check-in realizado com sucesso!"
          );

          utils.ranking.topPlaces.invalidate();
        },

        onError: (
          err
        ) => {
          toast.error(
            err.message ||
              "Erro ao realizar check-in"
          );
        },
      }
    );

  /* ---------------------------------- */
  /* ACTIONS */
  /* ---------------------------------- */

  function handleSubmit() {
    if (!selectedPlace) {
      toast.error(
        "Selecione um local"
      );
      return;
    }

    if (rating === 0) {
      toast.error(
        "Escolha uma nota"
      );
      return;
    }

    checkinMutation.mutate({
      placeId:
        selectedPlace.id,
      rating,
      comment:
        comment.trim() ||
        undefined,
      occupancy,
    });
  }

  /* ---------------------------------- */
  /* STATES */
  /* ---------------------------------- */

  if (!isAuthenticated)
    return null;

  if (!coords || isLoading) {
    return (
      <PageCenter>
        <Loader2
          size={32}
          className="animate-spin"
          style={{
            color:
              theme.colors.primary,
          }}
        />
      </PageCenter>
    );
  }

  if (submitted) {
    return (
      <PageCenter>
        <CheckCircle
          size={44}
          style={{
            color:
              theme.colors.primary,
          }}
        />

        <h2 className="text-xl font-bold mt-4">
          Check-in confirmado
        </h2>

        <Button
          className="mt-6"
          onClick={() =>
            setLocation("/")
          }
        >
          Voltar ao mapa
        </Button>
      </PageCenter>
    );
  }

  /* ---------------------------------- */
  /* PAGE */
  /* ---------------------------------- */

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          theme.colors.background,
        color:
          theme.colors.text,
      }}
    >
      <Header
        step={step}
        onBack={() =>
          step ===
          "review"
            ? setStep(
                "select"
              )
            : setLocation(
                "/"
              )
        }
      />

      <main className="flex-1 overflow-y-auto p-4">
        {step === "select" && (
          <SelectStep
            search={search}
            setSearch={
              setSearch
            }
            places={
              filteredPlaces
            }
            onSelect={(
              place: any
            ) => {
              setSelectedPlace(
                place
              );
              setStep(
                "review"
              );
            }}
          />
        )}

        {step === "review" &&
          selectedPlace && (
            <ReviewStep
              selectedPlace={
                selectedPlace
              }
              rating={
                rating
              }
              setRating={
                setRating
              }
              comment={
                comment
              }
              setComment={
                setComment
              }
              occupancy={
                occupancy
              }
              setOccupancy={
                setOccupancy
              }
              onChangePlace={() =>
                setStep(
                  "select"
                )
              }
              onSubmit={
                handleSubmit
              }
              loading={
                checkinMutation.isPending
              }
            />
          )}
      </main>
    </div>
  );
}

/* ================================================== */
/* HEADER */
/* ================================================== */

function Header({
  step,
  onBack,
}: any) {
  return (
    <header
      className="px-4 py-3 border-b flex items-center gap-3"
      style={{
        borderColor:
          theme.colors.border,
        background:
          theme.colors.surface,
      }}
    >
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background:
            theme.colors.surfaceSoft,
        }}
      >
        <ArrowLeft
          size={18}
        />
      </button>

      <div>
        <h1 className="font-bold">
          Fazer Check-in
        </h1>

        <p
          className="text-xs"
          style={{
            color:
              theme.colors.textMuted,
          }}
        >
          {step ===
          "select"
            ? "Etapa 1 de 2"
            : "Etapa 2 de 2"}
        </p>
      </div>
    </header>
  );
}

/* ================================================== */
/* STEP 1 */
/* ================================================== */

function SelectStep({
  search,
  setSearch,
  places,
  onSelect,
}: any) {
  return (
    <div className="space-y-5">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-3"
          style={{
            color:
              theme.colors.textMuted,
          }}
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Buscar local..."
          className="w-full h-12 pl-10 pr-4 rounded-xl border outline-none"
          style={{
            background:
              theme.colors.surface,
            borderColor:
              theme.colors.border,
          }}
        />
      </div>

      <div>
        <p className="text-sm font-semibold mb-3">
          Locais próximos
        </p>

        <div className="space-y-2">
          {places.map(
            (place: any) => (
              <button
                key={
                  place.id
                }
                onClick={() =>
                  onSelect(
                    place
                  )
                }
                className="w-full text-left rounded-xl border p-3 transition"
                style={{
                  background:
                    theme.colors.surface,
                  borderColor:
                    theme.colors.border,
                }}
              >
                <p className="font-semibold">
                  {
                    place.name
                  }
                </p>

                <div
                  className="flex items-center gap-1 text-xs mt-1"
                  style={{
                    color:
                      theme.colors.textMuted,
                  }}
                >
                  <MapPin size={12} />
                  {
                    place.address
                  }
                </div>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================== */
/* STEP 2 */
/* ================================================== */

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
      <Card>
        <p className="font-semibold">
          {
            selectedPlace.name
          }
        </p>

        <p
          className="text-sm mt-1"
          style={{
            color:
              theme.colors.textMuted,
          }}
        >
          {
            selectedPlace.address
          }
        </p>

        <button
          onClick={
            onChangePlace
          }
          className="text-sm mt-3"
          style={{
            color:
              theme.colors.primary,
          }}
        >
          Trocar local
        </button>
      </Card>

      <div>
        <Label className="mb-3 block">
          Avaliação
        </Label>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(
            (star) => (
              <button
                key={star}
                onClick={() =>
                  setRating(
                    star
                  )
                }
              >
                <Star
                  size={34}
                  className={
                    star <=
                    rating
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-zinc-700"
                  }
                />
              </button>
            )
          )}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">
          Comentário
        </Label>

        <Textarea
          rows={4}
          value={comment}
          onChange={(e) =>
            setComment(
              e.target.value
            )
          }
          placeholder="Compartilhe sua experiência..."
        />
      </div>

      <div>
        <Label className="mb-2 block">
          Ocupação
        </Label>

        <RadioGroup
          value={
            occupancy ??
            ""
          }
          onValueChange={(
            v
          ) =>
            setOccupancy(
              v as any
            )
          }
        >
          <Option
            value="empty"
            label="Vazio"
          />
          <Option
            value="moderate"
            label="Moderado"
          />
          <Option
            value="full"
            label="Cheio"
          />
        </RadioGroup>
      </div>

      <Button
        className="w-full h-14 rounded-xl font-semibold transition-all duration-200"
        style={{
          background: loading
            ? theme.colors.border
            : theme.colors.primary,
        
          color: loading
            ? theme.colors.textMuted
            : theme.colors.background,
        }}
        onClick={onSubmit}
        disabled={loading}
      >
        {loading
          ? "Enviando..."
          : "Confirmar Check-in"}
      </Button>
    </div>
  );
}

/* ================================================== */
/* HELPERS */
/* ================================================== */

function Card({
  children,
}: any) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background:
          theme.colors.surface,
        borderColor:
          theme.colors.border,
      }}
    >
      {children}
    </div>
  );
}

function Option({
  value,
  label,
}: any) {
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem
        value={value}
        id={value}
      />
      <Label htmlFor={value}>
        {label}
      </Label>
    </div>
  );
}

function PageCenter({
  children,
}: any) {
  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center px-4">
      {children}
    </div>
  );
}