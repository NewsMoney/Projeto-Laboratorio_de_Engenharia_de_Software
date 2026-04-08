import { trpc } from "@/lib/trpc";
import { ArrowLeft, Trophy, Star, MapPin, Users, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Ranking() {
  const [, setLocation] = useLocation();

  const { data: topUsers, isLoading: usersLoading } = trpc.ranking.topUsers.useQuery({ limit: 20 });
  const { data: topPlaces, isLoading: placesLoading } = trpc.ranking.topPlaces.useQuery({ limit: 10 });

  const getBadge = (rank: number) => {
    if (rank === 1) return { emoji: "🏆", bg: "bg-yellow-500/10 border-yellow-500/30" };
    if (rank === 2) return { emoji: "🥈", bg: "bg-slate-400/10 border-slate-400/30" };
    if (rank === 3) return { emoji: "🥉", bg: "bg-amber-600/10 border-amber-600/30" };
    return { emoji: "", bg: "bg-card border-border" };
  };

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
        <h1 className="text-base font-bold text-foreground">Ranking</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full mb-4 bg-secondary">
            <TabsTrigger value="users" className="flex-1 gap-1.5">
              <Users size={14} />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="places" className="flex-1 gap-1.5">
              <MapPin size={14} />
              Locais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : !topUsers || topUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <Trophy size={32} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhum ranking disponível ainda
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Faça check-ins para aparecer aqui
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {topUsers.map((user, index) => {
                  const rank = index + 1;
                  const badge = getBadge(rank);
                  return (
                    <div
                      key={user.id}
                      className={`rounded-xl p-3.5 flex items-center gap-3 border ${badge.bg}`}
                    >
                      <div className="w-8 text-center">
                        {badge.emoji ? (
                          <span className="text-xl">{badge.emoji}</span>
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">
                            #{rank}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user.name ?? "Usuário"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Number(user.checkinCount)} check-ins
                          {Number(user.avgRating) > 0 && (
                            <span className="ml-2">
                              <Star
                                size={10}
                                className="inline text-yellow-500 fill-yellow-500 mr-0.5"
                              />
                              {Number(user.avgRating).toFixed(1)}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">#{rank}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="places">
            {placesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : !topPlaces || topPlaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <MapPin size={32} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhum local com check-ins ainda
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Explore o mapa e faça check-ins
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {topPlaces.map((place, index) => (
                  <button
                    key={place.id}
                    onClick={() => setLocation(`/details/${place.id}`)}
                    className="w-full rounded-xl border border-border bg-card p-3.5 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {place.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Number(place.checkinCount)} check-ins
                      </p>
                    </div>
                    <div className="text-right">
                      {Number(place.avgRating) > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Star size={12} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-semibold text-foreground">
                            {Number(place.avgRating).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
