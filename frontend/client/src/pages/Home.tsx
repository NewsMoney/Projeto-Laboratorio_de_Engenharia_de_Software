import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LeafletMap from "@/components/LeafletMap";
import { trpc } from "@/lib/trpc";
import {
  Search,
  MapPin,
  User,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, isAuthenticated } =
    useAuth();

  const [, setLocation] =
    useLocation();

  const [search, setSearch] =
    useState("");

  const { data: topPlaces } =
    trpc.places.topPlaces.useQuery({
      limit: 20,
    });

  const filteredPlaces =
    useMemo(() => {
      if (!topPlaces) return [];

      if (!search.trim())
        return topPlaces;

      return topPlaces.filter(
        (p) =>
          p.name
            .toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          p.address
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [topPlaces, search]);

  const mapPlaces =
    filteredPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      category: p.category,
      address: p.address,
    }));

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card/85 backdrop-blur-md border-b border-border/50">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
          <MapPin
            size={17}
            className="text-primary-foreground"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate">
            JoinMe
          </h1>

          {isAuthenticated &&
          user?.name ? (
            <p className="text-xs text-muted-foreground truncate">
              Olá, {user.name}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Descubra locais perto de você
            </p>
          )}
        </div>

        {isAuthenticated ? (
          <button
            onClick={() =>
              setLocation(
                "/profile"
              )
            }
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
          >
            <User size={16} />
          </button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setLocation(
                "/login"
              )
            }
          >
            Entrar
          </Button>
        )}
      </header>

      {/* mapa */}
      <div className="flex-1 relative">
        <LeafletMap
          places={mapPlaces}
          onPlaceClick={(
            place
          ) =>
            setLocation(
              `/details/${place.id}`
            )
          }
          showUserLocation
          className="w-full h-full absolute inset-0"
        />

        {/* Busca */}
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl h-12 px-4 flex items-center gap-3 shadow-xl">
            <Search
              size={18}
              className="text-muted-foreground"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Pesquisar locais..."
              className="flex-1 bg-transparent outline-none text-sm"
            />

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
              >
                <X
                  size={16}
                  className="text-muted-foreground"
                />
              </button>
            )}
          </div>
        </div>

        {/* contador */}
        <div className="absolute top-20 left-4 z-[1000]">
          <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-full px-3 py-1.5 shadow-lg">
            <p className="text-xs font-medium">
              {
                filteredPlaces.length
              }{" "}
              locais
            </p>
          </div>
        </div>

        {/* populares */}
        {filteredPlaces &&
          filteredPlaces.length >
            0 && (
            <div className="absolute bottom-4 left-4 right-4 z-[1000]">
              <div className="bg-card/92 backdrop-blur-md border border-border/50 rounded-2xl p-3 shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Locais populares
                  </p>

                  <button
                    onClick={() =>
                      setLocation(
                        "/map"
                      )
                    }
                    className="text-xs text-primary"
                  >
                    Ver mapa
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {filteredPlaces
                    .slice(0, 6)
                    .map(
                      (
                        place
                      ) => (
                        <button
                          key={
                            place.id
                          }
                          onClick={() =>
                            setLocation(
                              `/details/${place.id}`
                            )
                          }
                          className="flex-shrink-0 min-w-[145px] bg-accent/80 rounded-xl px-3 py-3 text-left hover:bg-accent transition-colors"
                        >
                          <p className="text-xs font-semibold truncate">
                            {
                              place.name
                            }
                          </p>

                          <p className="text-[10px] text-muted-foreground mt-1 truncate">
                            {
                              place.address
                            }
                          </p>

                          <p className="text-[10px] text-primary mt-1">
                            {Number(
                              place.checkinCount
                            )}{" "}
                            check-ins
                          </p>
                        </button>
                      )
                    )}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}