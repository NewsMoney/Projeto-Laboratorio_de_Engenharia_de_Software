import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
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

export default function CheckIn() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const [step, setStep] =
    useState<"select" | "review">("select");

  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [selectedPlace, setSelectedPlace] =
    useState<any>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [occupancy, setOccupancy] =
    useState<"empty" | "moderate" | "full" | undefined>();

  const [submitted, setSubmitted] =
    useState(false);

  /* auth */
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  /* geolocation */
  useEffect(() => {
    if (!isAuthenticated) return;

    const fallback = {
      lat: -23.5505,
      lng: -46.6333,
    };

    if (!("geolocation" in navigator)) {
      setCoords(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => setCoords(fallback),
      {
        timeout: 5000,
      }
    );
  }, [isAuthenticated]);

  /* locais próximos */
  const { data: places, isLoading } =
    trpc.places.nearby.useQuery(
      {
        lat: coords?.lat ?? -23.5505,
        lng: coords?.lng ?? -46.6333,
        limit: 20,
      },
      {
        enabled: !!coords && isAuthenticated,
      }
    );

  const filteredPlaces = useMemo(() => {
    if (!places) return [];

    if (!search.trim()) return places;

    return places.filter((p) =>
      p.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [places, search]);

  const utils = trpc.useUtils();

  const checkinMutation =
    trpc.checkins.create.useMutation({
      onSuccess: () => {
        setSubmitted(true);

        toast.success(
          "Check-in realizado com sucesso!"
        );

        utils.ranking.topPlaces.invalidate();
      },

      onError: (err) => {
        toast.error(
          err.message ||
            "Erro ao realizar check-in"
        );
      },
    });

  function handleSubmit() {
    if (!selectedPlace) {
      toast.error("Selecione um local");
      return;
    }

    if (rating === 0) {
      toast.error("Escolha uma nota");
      return;
    }

    checkinMutation.mutate({
      placeId: selectedPlace.id,
      rating,
      comment: comment.trim() || undefined,
      occupancy,
    });
  }

  if (!isAuthenticated) return null;

  if (!coords || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin text-primary"
        />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <CheckCircle
          size={42}
          className="text-primary mb-4"
        />

        <h2 className="text-lg font-bold">
          Check-in confirmado!
        </h2>

        <Button
          className="mt-5"
          onClick={() => setLocation("/")}
        >
          Voltar ao mapa
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() =>
            step === "review"
              ? setStep("select")
              : setLocation("/")
          }
          className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="font-bold">
            Fazer Check-in
          </h1>

          <p className="text-xs text-muted-foreground">
            {step === "select"
              ? "Etapa 1 de 2"
              : "Etapa 2 de 2"}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {/* ETAPA 1 */}
        {step === "select" && (
          <div className="space-y-5">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-3 text-muted-foreground"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Buscar local..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background"
              />
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">
                Locais próximos
              </p>

              <div className="space-y-2">
                {filteredPlaces.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => {
                      setSelectedPlace(
                        place
                      );
                      setStep(
                        "review"
                      );
                    }}
                    className="w-full text-left rounded-xl border border-border bg-card p-3 hover:border-primary transition-colors"
                  >
                    <p className="font-semibold">
                      {place.name}
                    </p>

                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin size={12} />
                      {place.address}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 2 */}
        {step === "review" &&
          selectedPlace && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="font-semibold">
                  {selectedPlace.name}
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPlace.address}
                </p>

                <button
                  onClick={() =>
                    setStep(
                      "select"
                    )
                  }
                  className="text-sm text-primary mt-3"
                >
                  Trocar local
                </button>
              </div>

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
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground/30"
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
                      v as
                        | "empty"
                        | "moderate"
                        | "full"
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="empty"
                      id="empty"
                    />
                    <Label htmlFor="empty">
                      Vazio
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="moderate"
                      id="moderate"
                    />
                    <Label htmlFor="moderate">
                      Moderado
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="full"
                      id="full"
                    />
                    <Label htmlFor="full">
                      Cheio
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                className="w-full"
                onClick={
                  handleSubmit
                }
                disabled={
                  checkinMutation.isPending
                }
              >
                {checkinMutation.isPending
                  ? "Enviando..."
                  : "Confirmar Check-in"}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}