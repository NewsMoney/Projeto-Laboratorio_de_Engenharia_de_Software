import {
  useState,
  useRef,
  useCallback,
} from "react";

import { useLocation } from "wouter";

import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";

import { Input } from "@/components/ui/input";

import {
  Search as SearchIcon,
  MapPin,
  ArrowLeft,
  Loader2,
} from "lucide-react";

/* ================================================== */
/* SEARCH PAGE */
/* ================================================== */

export default function Search() {
  const [, setLocation] =
    useLocation();

  const [query, setQuery] =
    useState("");

  const [
    debouncedQuery,
    setDebouncedQuery,
  ] = useState("");

  const timerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const {
    data: searchResults,
    isLoading,
  } =
    trpc.places.search.useQuery(
      {
        query:
          debouncedQuery,
      },
      {
        enabled:
          debouncedQuery.length >
          0,
      }
    );

  const {
    data: allPlaces,
  } =
    trpc.places.list.useQuery(
      {
        limit: 20,
        offset: 0,
      },
      {
        enabled:
          debouncedQuery.length ===
          0,
      }
    );

  const places =
    debouncedQuery.length >
    0
      ? searchResults
      : allPlaces;

  const handleSearch =
    useCallback(
      (
        value: string
      ) => {
        setQuery(value);

        if (
          timerRef.current
        ) {
          clearTimeout(
            timerRef.current
          );
        }

        timerRef.current =
          setTimeout(
            () => {
              setDebouncedQuery(
                value.trim()
              );
            },
            300
          );
      },
      []
    );

  return (
    <div
      className="flex-1 flex flex-col min-h-screen"
      style={{
        background:
          theme.colors.background,
        color:
          theme.colors.text,
      }}
    >
      {/* HEADER */}
      <header
        className="px-4 py-3 border-b"
        style={{
          background:
            theme.colors.surface,
          borderColor:
            theme.colors.border,
        }}
      >
        <div className="flex items-center gap-3 mb-3 lg:hidden">
          <button
            onClick={() =>
              setLocation("/")
            }
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background:
                theme.colors.surfaceSoft,
            }}
          >
            <ArrowLeft
              size={18}
            />
          </button>

          <h1 className="text-lg font-bold">
            Buscar Locais
          </h1>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative">
          <SearchIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{
              color:
                theme.colors.textMuted,
            }}
          />

          <Input
            value={query}
            onChange={(
              e
            ) =>
              handleSearch(
                e.target
                  .value
              )
            }
            placeholder="Buscar por nome do local..."
            autoFocus
            className="pl-10 h-11 border rounded-xl"
            style={{
              background:
                theme.colors.surfaceSoft,
              borderColor:
                theme.colors.border,
              color:
                theme.colors.text,
            }}
          />
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <LoadingState />
        )}

        {!isLoading &&
          places &&
          places.length ===
            0 && (
            <EmptyState
              searching={
                debouncedQuery.length >
                0
              }
            />
          )}

        {places &&
          places.length >
            0 && (
            <div
              className="divide-y"
              style={{
                borderColor:
                  theme
                    .colors
                    .border,
              }}
            >
              {places.map(
                (
                  place
                ) => (
                  <PlaceRow
                    key={
                      place.id
                    }
                    place={
                      place
                    }
                    onOpen={() =>
                      setLocation(
                        `/details/${place.id}`
                      )
                    }
                  />
                )
              )}
            </div>
          )}
      </div>
    </div>
  );
}

/* ================================================== */
/* STATES */
/* ================================================== */

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2
        size={24}
        className="animate-spin"
        style={{
          color:
            theme.colors.primary,
        }}
      />
    </div>
  );
}

function EmptyState({
  searching,
}: {
  searching: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background:
            theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <MapPin
          size={30}
          style={{
            color:
              theme.colors.textMuted,
          }}
        />
      </div>

      <p
        className="text-sm font-medium"
        style={{
          color:
            theme.colors.textMuted,
        }}
      >
        {searching
          ? "Nenhum local encontrado"
          : "Nenhum local cadastrado ainda"}
      </p>

      {searching && (
        <p
          className="text-xs mt-1"
          style={{
            color:
              theme.colors.textMuted,
            opacity: 0.7,
          }}
        >
          Tente buscar com outros termos
        </p>
      )}
    </div>
  );
}

/* ================================================== */
/* PLACE ROW */
/* ================================================== */

function PlaceRow({
  place,
  onOpen,
}: any) {
  return (
    <button
      onClick={onOpen}
      className="w-full px-4 py-3.5 flex items-start gap-3 text-left transition"
      style={{
        background:
          theme.colors.background,
      }}
    >
      {/* ICON */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background:
            theme.colors.surfaceSoft,
        }}
      >
        <MapPin
          size={18}
          style={{
            color:
              theme.colors.primary,
          }}
        />
      </div>

      {/* INFO */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {place.name}
        </p>

        <p
          className="text-xs mt-0.5 truncate"
          style={{
            color:
              theme.colors.textMuted,
          }}
        >
          {place.address}
        </p>

        {place.category &&
          place.category !==
            "general" && (
            <span
              className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background:
                  theme.colors.surfaceSoft,
                color:
                  theme.colors.textSoft,
              }}
            >
              {
                place.category
              }
            </span>
          )}
      </div>
    </button>
  );
}