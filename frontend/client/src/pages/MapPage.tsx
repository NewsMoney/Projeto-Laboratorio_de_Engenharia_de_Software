import { useState } from "react";
import { useLocation } from "wouter";

import LeafletMap, {
  MapPlace,
} from "@/components/LeafletMap";

import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ================================================== */
/* MAP PAGE */
/* ================================================== */

export default function MapPage() {
  const [, setLocation] =
    useLocation();

  const [
    selectedPlace,
    setSelectedPlace,
  ] = useState<{
    id: number;
    name: string;
    address: string;
    category:
      | string
      | null;
  } | null>(null);

  const { data: places } =
    trpc.places.list.useQuery({
      limit: 100,
      offset: 0,
    });

  const mapPlaces: MapPlace[] =
    (places ?? []).map(
      (p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        category:
          p.category,
        address:
          p.address,
      })
    );

  function handlePlaceClick(
    place: MapPlace
  ) {
    setSelectedPlace({
      id: place.id,
      name: place.name,
      address:
        place.address ??
        "",
      category:
        place.category ??
        null,
    });
  }

  return (
    <div
      className="flex-1 relative"
      style={{
        background:
          theme.colors.background,
      }}
    >
      {/* MAPA */}
      <LeafletMap
        places={mapPlaces}
        onPlaceClick={
          handlePlaceClick
        }
        showUserLocation
        className="absolute inset-0 w-full h-full"
      />

      {/* CARD LOCAL */}
      {selectedPlace && (
        <div className="absolute bottom-20 lg:bottom-4 left-4 right-4 z-[1000] max-w-md mx-auto">
          <div
            className="rounded-2xl border p-4"
            style={{
              background:
                theme.colors.surface,
              borderColor:
                theme.colors.border,
              boxShadow:
                theme.shadow.card,
            }}
          >
            {/* TOP */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold truncate">
                  {
                    selectedPlace.name
                  }
                </h3>

                <p
                  className="text-xs mt-1"
                  style={{
                    color:
                      theme
                        .colors
                        .textMuted,
                  }}
                >
                  {
                    selectedPlace.address
                  }
                </p>

                {selectedPlace.category &&
                  selectedPlace.category !==
                    "general" && (
                    <span
                      className="inline-block mt-2 text-[10px] px-2 py-1 rounded-full font-medium"
                      style={{
                        background:
                          theme
                            .colors
                            .surfaceSoft,
                        color:
                          theme
                            .colors
                            .textSoft,
                      }}
                    >
                      {
                        selectedPlace.category
                      }
                    </span>
                  )}
              </div>

              <button
                onClick={() =>
                  setSelectedPlace(
                    null
                  )
                }
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    theme
                      .colors
                      .surfaceSoft,
                }}
              >
                <X
                  size={16}
                  style={{
                    color:
                      theme
                        .colors
                        .textMuted,
                  }}
                />
              </button>
            </div>

            {/* ACTIONS */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                className="h-11 rounded-xl font-semibold"
                style={{
                  background:
                    theme
                      .colors
                      .primary,
                  color:
                    theme
                      .colors
                      .background,
                  boxShadow:
                    theme
                      .shadow
                      .neon,
                }}
                onClick={() =>
                  setLocation(
                    `/details/${selectedPlace.id}`
                  )
                }
              >
                Ver detalhes
              </Button>

              <Button
                variant="outline"
                className="h-11 rounded-xl font-semibold"
                style={{
                  borderColor:
                    theme
                      .colors
                      .primary,
                  color:
                    theme
                      .colors
                      .primary,
                  background:
                    "transparent",
                }}
                onClick={() =>
                  setLocation(
                    `/checkin/${selectedPlace.id}`
                  )
                }
              >
                Check-in
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}