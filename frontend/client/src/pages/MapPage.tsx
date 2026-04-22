import { useState } from "react";
import LeafletMap, { MapPlace } from "@/components/LeafletMap";
import { trpc } from "@/lib/trpc";
import { X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function MapPage() {
  const [, setLocation] = useLocation();
  const [selectedPlace, setSelectedPlace] = useState<{
    id: number;
    name: string;
    address: string;
    category: string | null;
  } | null>(null);

  const { data: places } = trpc.places.list.useQuery({ limit: 100, offset: 0 });

  const mapPlaces: MapPlace[] = (places ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    category: p.category,
    address: p.address,
  }));

  const handlePlaceClick = (place: MapPlace) => {
    setSelectedPlace({
      id: place.id,
      name: place.name,
      address: place.address ?? "",
      category: place.category ?? null,
    });
  };

  return (
    <div className="flex-1 relative">
      <LeafletMap
        places={mapPlaces}
        onPlaceClick={handlePlaceClick}
        showUserLocation
        className="w-full h-full absolute inset-0"
      />

      {/* Selected place card */}
      {selectedPlace && (
        <div className="absolute bottom-20 lg:bottom-4 left-4 right-4 z-[1000] max-w-md mx-auto">
          <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground">{selectedPlace.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedPlace.address}</p>
                {selectedPlace.category && selectedPlace.category !== "general" && (
                  <span className="inline-block mt-1.5 text-[10px] font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                    {selectedPlace.category}
                  </span>
                )}
              </div>
              <Button
                onClick={() => setSelectedPlace(null)}
                className="text-muted-foreground hover:text-foreground ml-2"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => setLocation(`/details/${selectedPlace.id}`)}
              >
                Ver detalhes
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setLocation(`/checkin/${selectedPlace.id}`)}
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
 
