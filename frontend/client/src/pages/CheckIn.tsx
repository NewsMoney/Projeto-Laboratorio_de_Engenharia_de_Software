import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Star, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function CheckIn() {
  const [, params] = useRoute("/checkin/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const placeId = params?.id ? parseInt(params.id, 10) : 0;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [occupancy, setOccupancy] = useState<"empty" | "moderate" | "full" | undefined>();
  const [submitted, setSubmitted] = useState(false);

  const { data: place, isLoading: placeLoading } = trpc.places.getById.useQuery(
    { id: placeId },
    { enabled: placeId > 0 }
  );

  const utils = trpc.useUtils();
  const checkinMutation = trpc.checkins.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Check-in realizado com sucesso!");
      utils.checkins.byPlace.invalidate({ placeId });
      utils.places.getById.invalidate({ id: placeId });
      utils.ranking.topUsers.invalidate();
      utils.ranking.topPlaces.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao realizar check-in");
    },
  });

  const handleSubmit = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (rating === 0) {
      toast.error("Selecione uma avaliação");
      return;
    }
    checkinMutation.mutate({
      placeId,
      rating,
      comment: comment.trim() || undefined,
      occupancy,
    });
  };

  if (placeId === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          Selecione um local para fazer check-in
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Busque ou explore o mapa para encontrar um local
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/search")}>
            Buscar local
          </Button>
          <Button onClick={() => setLocation("/")}>Ver mapa</Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(20,184,166,0.2)]">
          <CheckCircle size={32} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">Check-in confirmado!</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Obrigado por compartilhar sua experiência
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation(`/details/${placeId}`)}>
            Ver local
          </Button>
          <Button onClick={() => setLocation("/")}>Voltar ao mapa</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
        <button
          onClick={() => setLocation(placeId > 0 ? `/details/${placeId}` : "/")}
          className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">Check-in</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Place card */}
        {placeLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : place ? (
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold text-foreground">{place.name}</h2>
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
              <MapPin size={14} className="text-primary" />
              <span className="text-sm">{place.address}</span>
            </div>
          </div>
        ) : null}

        {/* Rating */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Como foi sua experiência?
          </h3>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  size={36}
                  className={
                    star <= rating
                      ? "text-yellow-500 fill-yellow-500 drop-shadow-[0_0_4px_rgba(234,179,8,0.4)]"
                      : "text-muted-foreground/30 hover:text-muted-foreground/50"
                  }
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Você avaliou com {rating} estrela{rating > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="mb-6">
          <Label className="text-sm font-semibold text-foreground mb-2 block">
            Deixe um comentário (opcional)
          </Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Compartilhe sua experiência..."
            rows={4}
            className="bg-secondary border-border resize-none"
          />
        </div>

        {/* Occupancy */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Nível de Ocupação
          </h3>
          <RadioGroup
            value={occupancy ?? ""}
            onValueChange={(v) => setOccupancy(v as "empty" | "moderate" | "full")}
            className="space-y-2"
          >
            {[
              { value: "empty", label: "Vazio", desc: "Poucos frequentadores" },
              { value: "moderate", label: "Moderado", desc: "Movimento normal" },
              { value: "full", label: "Cheio", desc: "Bastante movimentado" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center gap-3 bg-secondary rounded-lg p-3">
                <RadioGroupItem value={opt.value} id={opt.value} />
                <div>
                  <Label htmlFor={opt.value} className="text-sm font-medium text-foreground">
                    {opt.label}
                  </Label>
                  <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Submit */}
        <Button
          className="w-full shadow-[0_0_16px_rgba(20,184,166,0.2)]"
          size="lg"
          onClick={handleSubmit}
          disabled={checkinMutation.isPending}
        >
          {checkinMutation.isPending ? (
            <Loader2 className="animate-spin mr-2" size={16} />
          ) : (
            <CheckCircle size={16} className="mr-2" />
          )}
          Confirmar Check-in
        </Button>
      </div>
    </div>
  );
}
