import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  User,
  MapPin,
  Star,
  CheckCircle,
  MessageSquare,
  LogOut,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

export default function Profile() {

  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();

  const { data: profileData, isLoading: profileLoading } = trpc.user.profile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4 ring-2 ring-primary/20">
          <User size={36} className="text-muted-foreground" />
        </div>

        <h2 className="text-lg font-bold text-foreground mb-1">
          Entre para ver seu perfil
        </h2>

        <p className="text-sm text-muted-foreground mb-6 text-center">
          Faça login para acompanhar seus check-ins
        </p>

        <Button
          onClick={() => setLocation("/login")}
        >
          Entrar
        </Button>
      </div>
    );
  }

  const stats = profileData?.stats;
  const recentCheckins = profileData?.recentCheckins;

  const level =
    Number(stats?.totalCheckins ?? 0) >= 100
      ? "Expert"
      : Number(stats?.totalCheckins ?? 0) >= 50
      ? "Avançado"
      : Number(stats?.totalCheckins ?? 0) >= 10
      ? "Intermediário"
      : "Iniciante";

  const levelColor =
    level === "Expert"
      ? "text-yellow-400"
      : level === "Avançado"
      ? "text-purple-400"
      : level === "Intermediário"
      ? "text-blue-400"
      : "text-primary";

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
        <h1 className="text-base font-bold text-foreground">Perfil</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* User info */}
        <div className="p-4">
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3 ring-2 ring-primary/30 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
              <User size={32} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {user?.name ?? "Usuário"}
            </h2>
            {user?.email && (
              <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
            )}

            {/* Stats grid */}
            {profileLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle size={14} className="text-primary" />
                      <span className="text-lg font-bold text-foreground">
                        {Number(stats?.totalCheckins ?? 0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Check-ins</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MapPin size={14} className="text-primary" />
                      <span className="text-lg font-bold text-foreground">
                        {Number(stats?.uniquePlaces ?? 0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Locais</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MessageSquare size={14} className="text-primary" />
                      <span className="text-lg font-bold text-foreground">
                        {Number(stats?.totalReviews ?? 0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Avaliações</p>
                  </div>
                </div>

                {/* Level badge */}
                <div className="mt-3 bg-accent border border-primary/20 rounded-lg p-2.5">
                  <p className={`text-xs font-semibold ${levelColor}`}>
                    Nível: {level}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent check-ins */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Check-ins Recentes</h3>
          {profileLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="animate-spin text-primary" size={20} />
            </div>
          ) : !recentCheckins || recentCheckins.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Nenhum check-in ainda. Explore o mapa!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCheckins.map((ci) => (
                <button
                  key={ci.id}
                  onClick={() => setLocation(`/details/${ci.placeId}`)}
                  className="w-full bg-card border border-border rounded-xl p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {ci.placeName ?? "Local"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(ci.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 ml-2">
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
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="px-4 pb-6">
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              logout();
              setLocation("/");
            }}
          >
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
