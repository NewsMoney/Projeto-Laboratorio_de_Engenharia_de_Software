import { useAuth } from "@/hooks/useAuth";
import LeafletMap from "@/components/LeafletMap";
import { trpc } from "@/lib/trpc";
import { Search, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: topPlaces } = trpc.places.topPlaces.useQuery({ limit: 20 });

  const mapPlaces = (topPlaces ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    category: p.category,
    address: p.address,
  }));

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <MapPin size={16} className="text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-foreground">JoinMe</h1>
          {isAuthenticated && user?.name && (
            <p className="text-xs text-muted-foreground">
              Olá, {user.name}
            </p>
          )}
        </div>
        {!isAuthenticated && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLocation("/login");
            }}
          >
            Entrar
          </Button>
        )}
      </header>

      {/* Map Area */}
      <div className="flex-1 relative">
        <LeafletMap
          places={mapPlaces}
          onPlaceClick={(place) => setLocation(`/details/${place.id}`)}
          showUserLocation
          className="w-full h-full absolute inset-0"
        />

        {/* Search overlay */}
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <button
            onClick={() => setLocation("/search")}
            className="w-full bg-card/90 backdrop-blur-md border border-border/50 rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl hover:bg-card transition-colors"
          >
            <Search size={18} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Pesquisar locais...</span>
          </button>
        </div>

        {/* Quick stats overlay */}
        {topPlaces && topPlaces.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-xl">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Locais populares perto de você
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {topPlaces.slice(0, 5).map((place) => (
                  <button
                    key={place.id}
                    onClick={() => setLocation(`/details/${place.id}`)}
                    className="flex-shrink-0 bg-accent/80 rounded-lg px-3 py-2 text-left hover:bg-accent transition-colors"
                  >
                    <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                      {place.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {Number(place.checkinCount)} check-ins
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
