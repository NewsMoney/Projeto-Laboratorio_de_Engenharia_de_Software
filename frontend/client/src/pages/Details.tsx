import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";
import { useRoute, useLocation } from "wouter";

import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Users,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/* ================================================== */
/* DETAILS */
/* ================================================== */

export default function Details() {
  const [, params] =
    useRoute(
      "/details/:id"
    );

  const [, setLocation] =
    useLocation();

  const placeId =
    params?.id
      ? parseInt(
          params.id,
          10
        )
      : 0;

  const {
    data: place,
    isLoading:
      placeLoading,
  } =
    trpc.places.getById.useQuery(
      { id: placeId },
      {
        enabled:
          placeId > 0,
      }
    );

  const {
    data:
      checkinsList,
  } =
    trpc.checkins.byPlace.useQuery(
      {
        placeId,
        limit: 20,
      },
      {
        enabled:
          placeId > 0,
      }
    );

  /* ---------------------------------- */
  /* LOADING */
  /* ---------------------------------- */

  if (placeLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <HeaderSkeleton />

        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  /* ---------------------------------- */
  /* NOT FOUND */
  /* ---------------------------------- */

  if (!place) {
    return (
      <EmptyState
        onBack={() =>
          setLocation("/")
        }
      />
    );
  }

  const avgRating =
    Number(
      place.avgRating ??
        0
    );

  const totalCheckins =
    Number(
      place.totalCheckins ??
        0
    );

  /* ---------------------------------- */
  /* PAGE */
  /* ---------------------------------- */

  return (
    <div
      className="flex-1 flex flex-col"
      style={{
        background:
          theme.colors.background,
        color:
          theme.colors.text,
      }}
    >
      <Header
        title={
          place.name
        }
        onBack={() =>
          setLocation("/")
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* INFO */}
        <div className="p-4">
          <Card>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {
                    place.name
                  }
                </h2>

                <div
                  className="flex items-center gap-1.5 mt-1 text-sm"
                  style={{
                    color:
                      theme.colors.textMuted,
                  }}
                >
                  <MapPin
                    size={
                      14
                    }
                    style={{
                      color:
                        theme.colors.primary,
                    }}
                  />

                  <span>
                    {
                      place.address
                    }
                  </span>
                </div>
              </div>

              {place.category &&
                place.category !==
                  "general" && (
                  <Badge>
                    {
                      place.category
                    }
                  </Badge>
                )}
            </div>

            {place.description && (
              <p
                className="text-sm leading-relaxed"
                style={{
                  color:
                    theme.colors.textMuted,
                }}
              >
                {
                  place.description
                }
              </p>
            )}

            {/* STATS */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <StatCard
                icon={
                  <Star
                    size={
                      16
                    }
                    className="fill-yellow-500 text-yellow-500"
                  />
                }
                value={
                  avgRating >
                  0
                    ? avgRating.toFixed(
                        1
                      )
                    : "—"
                }
                label="Avaliação média"
              />

              <StatCard
                icon={
                  <CheckCircle
                    size={
                      16
                    }
                    style={{
                      color:
                        theme.colors.primary,
                    }}
                  />
                }
                value={
                  totalCheckins
                }
                label="Check-ins"
              />
            </div>

            {/* CTA */}
            <Button
              className="w-full h-14 mt-4 rounded-xl font-semibold"
              style={{
                background:
                  theme.colors.primary,
                color:
                  theme.colors.background,
                boxShadow:
                  theme.shadow.neon,
              }}
              onClick={() =>
                setLocation(
                  `/checkin/${placeId}`
                )
              }
            >
              <CheckCircle
                size={16}
                className="mr-2"
              />
              Fazer Check-in
            </Button>
          </Card>
        </div>

        {/* REVIEWS */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold mb-3">
            Avaliações recentes (
            {checkinsList?.length ??
              0}
            )
          </h3>

          {(!checkinsList ||
            checkinsList.length ===
              0) && (
            <Card className="text-center p-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{
                  background:
                    theme.colors.surfaceSoft,
                }}
              >
                <Users
                  size={24}
                  style={{
                    color:
                      theme.colors.textMuted,
                  }}
                />
              </div>

              <p
                className="text-xs"
                style={{
                  color:
                    theme.colors.textMuted,
                }}
              >
                Nenhuma avaliação ainda.
                Seja o primeiro!
              </p>
            </Card>
          )}

          {checkinsList &&
            checkinsList.length >
              0 && (
              <div className="space-y-2">
                {checkinsList.map(
                  (ci) => (
                    <ReviewCard
                      key={
                        ci.id
                      }
                      review={
                        ci
                      }
                    />
                  )
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

/* ================================================== */
/* COMPONENTS */
/* ================================================== */

function Header({
  title,
  onBack,
}: any) {
  return (
    <header
      className="px-4 py-3 flex items-center gap-3 border-b"
      style={{
        background:
          theme.colors.surface,
        borderColor:
          theme.colors.border,
      }}
    >
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background:
            theme.colors.surfaceSoft,
        }}
      >
        <ArrowLeft
          size={18}
        />
      </button>

      <h1 className="font-bold truncate">
        {title}
      </h1>
    </header>
  );
}

function HeaderSkeleton() {
  return (
    <header className="px-4 py-3 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="h-5 w-40" />
    </header>
  );
}

function EmptyState({
  onBack,
}: any) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background:
            theme.colors.surface,
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
        className="text-sm"
        style={{
          color:
            theme.colors.textMuted,
        }}
      >
        Local não encontrado
      </p>

      <Button
        className="mt-4"
        onClick={onBack}
      >
        Voltar ao mapa
      </Button>
    </div>
  );
}

function Card({
  children,
  className = "",
}: any) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{
        background:
          theme.colors.surface,
        borderColor:
          theme.colors.border,
      }}
    >
      {children}
    </div>
  );
}

function Badge({
  children,
}: any) {
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{
        background:
          theme.colors.surfaceSoft,
        color:
          theme.colors.textSoft,
      }}
    >
      {children}
    </span>
  );
}

function StatCard({
  icon,
  value,
  label,
}: any) {
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{
        background:
          theme.colors.surfaceSoft,
      }}
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}

        <span className="text-lg font-bold">
          {value}
        </span>
      </div>

      <p
        className="text-xs"
        style={{
          color:
            theme.colors.textMuted,
        }}
      >
        {label}
      </p>
    </div>
  );
}

function ReviewCard({
  review,
}: any) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">
          {review.userName ??
            "Anônimo"}
        </span>

        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(
            (s) => (
              <Star
                key={s}
                size={12}
                className={
                  s <=
                  review.rating
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-zinc-700"
                }
              />
            )
          )}
        </div>
      </div>

      {review.comment && (
        <p
          className="text-xs leading-relaxed"
          style={{
            color:
              theme.colors.textMuted,
          }}
        >
          {
            review.comment
          }
        </p>
      )}

      <div className="flex items-center gap-3 mt-2">
        {review.occupancy && (
          <Badge>
            {review.occupancy ===
            "empty"
              ? "Vazio"
              : review.occupancy ===
                "moderate"
              ? "Moderado"
              : "Cheio"}
          </Badge>
        )}

        <span
          className="text-[10px] flex items-center gap-1"
          style={{
            color:
              theme.colors.textMuted,
          }}
        >
          <Clock
            size={10}
          />
          {new Date(
            review.createdAt
          ).toLocaleDateString(
            "pt-BR"
          )}
        </span>
      </div>
    </Card>
  );
}