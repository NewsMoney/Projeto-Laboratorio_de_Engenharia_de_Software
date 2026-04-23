import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";

import {
  ArrowLeft,
  Star,
  MapPin,
  Loader2,
} from "lucide-react";

import { useLocation } from "wouter";

/* ================================================== */
/* RANKING */
/* ================================================== */

export default function Ranking() {
  const [, setLocation] =
    useLocation();

  const {
    data: topPlaces,
    isLoading:
      placesLoading,
  } =
    trpc.ranking.topPlaces.useQuery(
      {
        limit: 10,
      }
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
        className="px-4 py-3 flex items-center gap-3 border-b lg:hidden"
        style={{
          background:
            theme.colors.surface,
          borderColor:
            theme.colors.border,
        }}
      >
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

        <h1 className="text-base font-bold">
          Ranking de Locais
        </h1>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-4">
        {placesLoading ? (
          <LoadingState />
        ) : !topPlaces ||
          topPlaces.length ===
            0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {topPlaces.map(
              (
                place,
                index
              ) => (
                <RankCard
                  key={
                    place.id
                  }
                  place={
                    place
                  }
                  index={
                    index
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
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
        Nenhum local com check-ins ainda
      </p>

      <p
        className="text-xs mt-1"
        style={{
          color:
            theme.colors.textMuted,
          opacity: 0.7,
        }}
      >
        Explore o mapa e faça check-ins
      </p>
    </div>
  );
}

/* ================================================== */
/* CARD */
/* ================================================== */

function RankCard({
  place,
  index,
  onOpen,
}: any) {
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-xl border p-3.5 flex items-center gap-3 text-left transition"
      style={{
        background:
          theme.colors.surface,
        borderColor:
          theme.colors.border,
      }}
    >
      {/* POSIÇÃO */}
      <div
        className="w-8 text-center text-sm font-bold"
        style={{
          color:
            theme.colors.primary,
        }}
      >
        #{index + 1}
      </div>

      {/* ICON */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
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
          className="text-xs"
          style={{
            color:
              theme.colors.textMuted,
          }}
        >
          {Number(
            place.checkinCount
          )}{" "}
          check-ins
        </p>
      </div>

      {/* RATING */}
      <div className="text-right min-w-[48px]">
        {Number(
          place.avgRating
        ) > 0 && (
          <div className="flex items-center justify-end gap-1">
            <Star
              size={12}
              className="fill-yellow-500 text-yellow-500"
            />

            <span className="text-xs font-semibold">
              {Number(
                place.avgRating
              ).toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}