import { useMemo, useState } from "react";
import { useLocation } from "wouter";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

import LeafletMap from "@/components/LeafletMap";
import { Button } from "@/components/ui/button";

import {
  Search,
  MapPin,
  User,
  X,
} from "lucide-react";

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

  /* -------------------------------- */
  /* Filter */
  /* -------------------------------- */

  const filteredPlaces =
    useMemo(() => {
      if (!topPlaces) {
        return [];
      }

      const term =
        search.trim().toLowerCase();

      if (!term) {
        return topPlaces;
      }

      return topPlaces.filter(
        (place) =>
          place.name
            .toLowerCase()
            .includes(term) ||
          place.address
            .toLowerCase()
            .includes(term)
      );
    }, [topPlaces, search]);

  /* -------------------------------- */
  /* Map Data */
  /* -------------------------------- */

  const mapPlaces =
    filteredPlaces.map(
      (place) => ({
        id: place.id,
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        category:
          place.category,
        address:
          place.address,
      })
    );

  /* -------------------------------- */
  /* Render */
  /* -------------------------------- */

  return (
    <div className="flex-1 flex flex-col h-full">
      <MobileHeader
        user={user}
        isAuthenticated={
          isAuthenticated
        }
        onProfile={() =>
          setLocation(
            "/profile"
          )
        }
        onLogin={() =>
          setLocation(
            "/login"
          )
        }
      />

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

        <SearchBar
          value={search}
          onChange={
            setSearch
          }
          onClear={() =>
            setSearch("")
          }
        />

        <PlacesCounter
          total={
            filteredPlaces.length
          }
        />

        {filteredPlaces.length >
          0 && (
          <PopularPlaces
            places={
              filteredPlaces
            }
            onOpen={(
              id: number
            ) =>
              setLocation(
                `/details/${id}`
              )
            }
            onMap={() =>
              setLocation(
                "/map"
              )
            }
          />
        )}
      </div>
    </div>
  );
}

/* -------------------------------- */
/* Header */
/* -------------------------------- */

function MobileHeader({
  user,
  isAuthenticated,
  onProfile,
  onLogin,
}: any) {
  return (
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
        user?.username ? (
          <p className="text-xs text-muted-foreground truncate">
            Olá, {user.username}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Descubra locais perto de você
          </p>
        )}
      </div>

      {isAuthenticated ? (
        <button
          onClick={
            onProfile
          }
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
        >
          <User size={16} />
        </button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={onLogin}
        >
          Entrar
        </Button>
      )}
    </header>
  );
}

/* -------------------------------- */
/* Search */
/* -------------------------------- */

function SearchBar({
  value,
  onChange,
  onClear,
}: any) {
  return (
    <div className="absolute top-4 left-4 right-4 z-[1000]">
      <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl h-12 px-4 flex items-center gap-3 shadow-xl">
        <Search
          size={18}
          className="text-muted-foreground"
        />

        <input
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          placeholder="Pesquisar locais..."
          className="flex-1 bg-transparent outline-none text-sm"
        />

        {value && (
          <button
            onClick={
              onClear
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
  );
}

/* -------------------------------- */
/* Counter */
/* -------------------------------- */

function PlacesCounter({
  total,
}: {
  total: number;
}) {
  return (
    <div className="absolute top-20 left-4 z-[1000]">
      <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-full px-3 py-1.5 shadow-lg">
        <p className="text-xs font-medium">
          {total} locais
        </p>
      </div>
    </div>
  );
}

/* -------------------------------- */
/* Popular */
/* -------------------------------- */

function PopularPlaces({
  places,
  onOpen,
  onMap,
}: any) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-[1000]">
      <div className="bg-card/92 backdrop-blur-md border border-border/50 rounded-2xl p-3 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Locais populares
          </p>

          <button
            onClick={onMap}
            className="text-xs text-primary"
          >
            Ver mapa
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {places
            .slice(0, 6)
            .map(
              (
                place: any
              ) => (
                <button
                  key={
                    place.id
                  }
                  onClick={() =>
                    onOpen(
                      place.id
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
  );
}