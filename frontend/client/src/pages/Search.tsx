import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Search as SearchIcon, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";

export default function Search() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: searchResults, isLoading } = trpc.places.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 }
  );

  const { data: allPlaces } = trpc.places.list.useQuery(
    { limit: 20, offset: 0 },
    { enabled: debouncedQuery.length === 0 }
  );

  const places = debouncedQuery.length > 0 ? searchResults : allPlaces;

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 300);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 mb-3 lg:hidden">
          <button
            onClick={() => setLocation("/")}
            className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Buscar Locais</h1>
        </div>
        <div className="relative">
          <SearchIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nome do local..."
            className="pl-10 bg-secondary border-border h-11"
            autoFocus
          />
        </div>
      </header>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        )}

        {!isLoading && places && places.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <MapPin size={32} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {debouncedQuery ? "Nenhum local encontrado" : "Nenhum local cadastrado ainda"}
            </p>
            {debouncedQuery && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Tente buscar com outros termos
              </p>
            )}
          </div>
        )}

        {places && places.length > 0 && (
          <div className="divide-y divide-border">
            {places.map((place) => (
              <button
                key={place.id}
                onClick={() => setLocation(`/details/${place.id}`)}
                className="w-full px-4 py-3.5 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {place.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {place.address}
                  </p>
                  {place.category && place.category !== "general" && (
                    <span className="inline-block mt-1.5 text-[10px] font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                      {place.category}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
