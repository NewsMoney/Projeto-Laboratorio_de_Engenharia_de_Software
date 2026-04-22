import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Star, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CheckIn() {
  const [, params] = useRoute("/checkin/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const placeId = params?.id ? parseInt(params.id, 10) : 0;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [occupancy, setOccupancy] =
    useState<"empty" | "moderate" | "full" | undefined>();
  const [submitted, setSubmitted] = useState(false);

  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  /* Se não estiver logado, manda para login */
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  /* Captura localização do usuário */
  useEffect(() => {
    if (!isAuthenticated) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {}
    );
  }, [isAuthenticated]);

  /* Locais próximos */
  const { data: nearbyPlaces } = trpc.places.nearby.useQuery(
    {
      lat: coords?.lat ?? 0,
      lng: coords?.lng ?? 0,
      limit: 10,
    },
    {
      enabled: !!coords && isAuthenticated,
    }
  );

  const place =
    nearbyPlaces?.find((p) => p.id === placeId) ??
    nearbyPlaces?.[0];

  const utils = trpc.useUtils();

  const checkinMutation = trpc.checkins.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Check-in realizado com sucesso!");
      utils.checkins.byPlace.invalidate({ placeId });
      utils.ranking.topPlaces.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao realizar check-in");
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Selecione uma avaliação");
      return;
    }

    if (!place) {
      toast.error("Nenhum local encontrado");
      return;
    }

    checkinMutation.mutate({
      placeId: place.id,
      rating,
      comment: comment.trim() || undefined,
      occupancy,
    });
  };

  if (!isAuthenticated) return null;

  if (!coords) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <CheckCircle size={40} className="text-primary mb-4" />
        <h2 className="text-lg font-bold">Check-in confirmado!</h2>

        <Button className="mt-5" onClick={() => setLocation("/")}>
          Voltar ao mapa
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setLocation("/")}
          className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="font-bold">Check-in</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {place && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold">{place.name}</h2>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin size={14} />
              {place.address}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Como foi sua experiência?</h3>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)}>
                <Star
                  size={34}
                  className={
                    star <= rating
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground/30"
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <Label className="mb-2 block">Comentário</Label>

          <Textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Compartilhe sua experiência..."
          />
        </div>

        <div className="mb-6">
          <Label className="mb-2 block">Nível de Ocupação</Label>

          <RadioGroup
            value={occupancy ?? ""}
            onValueChange={(v) =>
              setOccupancy(v as "empty" | "moderate" | "full")
            }
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="empty" id="empty" />
              <Label htmlFor="empty">Vazio</Label>
            </div>

            <div className="flex items-center gap-2">
              <RadioGroupItem value="moderate" id="moderate" />
              <Label htmlFor="moderate">Moderado</Label>
            </div>

            <div className="flex items-center gap-2">
              <RadioGroupItem value="full" id="full" />
              <Label htmlFor="full">Cheio</Label>
            </div>
          </RadioGroup>
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={checkinMutation.isPending}
        >
          {checkinMutation.isPending ? "Enviando..." : "Confirmar Check-in"}
        </Button>
      </div>
    </div>
  );
}