import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Users,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Details() {
  const [, params] = useRoute("/details/:id");
  const [, setLocation] = useLocation();
  const placeId = params?.id ? parseInt(params.id, 10) : 0;

  const { data: place, isLoading: placeLoading } = trpc.places.getById.useQuery(
    { id: placeId },
    { enabled: placeId > 0 }
  );

  const { data: checkinsList } = trpc.checkins.byPlace.useQuery(
    { placeId, limit: 20 },
    { enabled: placeId > 0 }
  );

  if (placeLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="h-5 w-40" />
        </header>
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
          <MapPin size={32} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Local não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/")}>
          Voltar ao mapa
        </Button>
      </div>
    );
  }

  const avgRating = Number(place.avgRating ?? 0);
  const totalCheckins = Number(place.totalCheckins ?? 0);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
        <button
          onClick={() => setLocation("/")}
          className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground truncate">{place.name}</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Place info card */}
        <div className="p-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{place.name}</h2>
                <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                  <MapPin size={14} className="text-primary" />
                  <span className="text-sm">{place.address}</span>
                </div>
              </div>
              {place.category && place.category !== "general" && (
                <span className="text-xs font-medium bg-accent text-accent-foreground px-2.5 py-1 rounded-full">
                  {place.category}
                </span>
              )}
            </div>

            {place.description && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {place.description}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-bold text-foreground">
                    {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Avaliação média</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle size={16} className="text-primary" />
                  <span className="text-lg font-bold text-foreground">{totalCheckins}</span>
                </div>
                <p className="text-xs text-muted-foreground">Check-ins</p>
              </div>
            </div>

            {/* CTA */}
            <Button
              className="w-full mt-4 shadow-[0_0_12px_rgba(20,184,166,0.2)]"
              onClick={() => setLocation(`/checkin/${placeId}`)}
            >
              <CheckCircle size={16} className="mr-2" />
              Fazer Check-in
            </Button>
          </div>
        </div>

        {/* Reviews */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Avaliações recentes ({checkinsList?.length ?? 0})
          </h3>
          {(!checkinsList || checkinsList.length === 0) && (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users size={24} className="text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Nenhuma avaliação ainda. Seja o primeiro!
              </p>
            </div>
          )}
          {checkinsList && checkinsList.length > 0 && (
            <div className="space-y-2">
              {checkinsList.map((ci) => (
                <div key={ci.id} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">
                      {ci.userName ?? "Anônimo"}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={
                            s <= ci.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground/20"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {ci.comment && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {ci.comment}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {ci.occupancy && (
                      <span className="text-[10px] font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                        {ci.occupancy === "empty"
                          ? "Vazio"
                          : ci.occupancy === "moderate"
                          ? "Moderado"
                          : "Cheio"}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(ci.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
