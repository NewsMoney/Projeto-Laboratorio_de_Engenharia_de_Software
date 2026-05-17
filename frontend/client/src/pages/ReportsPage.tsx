import { useState } from "react";
import { useLocation } from "wouter";

import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";

import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";

import { DesktopSidebar } from "../components/DesktopUI";
import { BottomNav, MobileHeader } from "@/components/MobileUI";

import {
  Users,
  MapPin,
  BarChart3,
  Star,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";

export default function Reports() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("week");

  /**
   * =========================================================================
   * DATE RANGE
   * =========================================================================
   */

  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  /**
   * =========================================================================
   * QUERIES
   * =========================================================================
   */

  const { data: summaryStats } = trpc.analytics.summaryStats.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const { data: checkinsTimeline } = trpc.analytics.checkinsTimeline.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const { data: topPlaces } = trpc.analytics.topPlaces.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    limit: 5,
  });

  const { data: occupancyData } = trpc.analytics.occupancyDistribution.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const { data: topRatedPlaces } = trpc.analytics.topRatedPlaces.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    limit: 5,
  });

  const { data: mostActiveUsers } = trpc.analytics.mostActiveUsers.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    limit: 5,
  });

  /**
   * =========================================================================
   * FALLBACKS
   * =========================================================================
   */

  const stats = summaryStats ?? {
    totalUsers: 0,
    totalCheckins: 0,
    totalPlaces: 0,
    activeUsers: 0,
    avgRating: 0,
  };

  const checkins = checkinsTimeline ?? [];
  const places = topPlaces ?? [];
  const occupancy = occupancyData ?? [];
  const ratedPlaces = topRatedPlaces ?? [];
  const activeUsers = mostActiveUsers ?? [];

  const getOccupancyColor = (occupancy: string) => {
    switch (occupancy) {
      case "empty":
        return "#6B7280";
      case "moderate":
        return theme.colors.primary;
      case "full":
        return "#EF4444";
      default:
        return theme.colors.text;
    }
  };

  const getOccupancyLabel = (occupancy: string) => {
    switch (occupancy) {
      case "empty":
        return "Vazio";
      case "moderate":
        return "Moderado";
      case "full":
        return "Cheio";
      default:
        return "Desconhecido";
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col lg:flex-row overflow-hidden"
      style={{ background: theme.colors.background }}
    >
      {!isMobile && <DesktopSidebar />}

      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-10 pb-24 lg:pb-10">

          {/* ================================================================ */}
          {/* MOBILE HEADER */}
          {/* ================================================================ */}

          {isMobile && (
            <div className="flex items-center justify-between mb-6">
              <MobileHeader
                isAuthenticated={isAuthenticated}
                onProfile={() => setLocation("/profile")}
                onLogin={() => setLocation("/login")}
              />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg"
                style={{ background: theme.colors.surface }}
              >
                {mobileMenuOpen ? (
                  <X size={20} color={theme.colors.primary} />
                ) : (
                  <Menu size={20} color={theme.colors.primary} />
                )}
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* HEADER */}
          {/* ================================================================ */}

          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Analytics
            </h1>
            <p
              className="text-xs sm:text-sm"
              style={{ color: theme.colors.text }}
            >
              Visão geral do desempenho do JoinMe
            </p>
          </div>

          {/* ================================================================ */}
          {/* FILTERS */}
          {/* ================================================================ */}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  start: e.target.value,
                }))
              }
              className="h-10 px-3 rounded-lg border outline-none text-xs sm:text-sm flex-1"
              style={{
                background: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />

            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  end: e.target.value,
                }))
              }
              className="h-10 px-3 rounded-lg border outline-none text-xs sm:text-sm flex-1"
              style={{
                background: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-10 px-3 rounded-lg border outline-none text-xs sm:text-sm"
              style={{
                background: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            >
              <option value="day">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
              <option value="year">Este ano</option>
            </select>
          </div>

          {/* ================================================================ */}
          {/* MAIN STATS */}
          {/* ================================================================ */}

          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">

            <StatCard
              icon={<Users size={18} />}
              label="Usuários"
              value={stats.totalUsers}
            />

            <StatCard
              icon={<MapPin size={18} />}
              label="Check-ins"
              value={stats.totalCheckins}
            />

            <StatCard
              icon={<BarChart3 size={18} />}
              label="Locais"
              value={stats.totalPlaces}
            />

            <StatCard
              icon={<TrendingUp size={18} />}
              label="Ativos"
              value={stats.activeUsers}
            />

            <StatCard
              icon={<Star size={18} />}
              label="Rating"
              value={stats.avgRating}
            />
          </section>

          {/* ================================================================ */}
          {/* CHARTS & DATA */}
          {/* ================================================================ */}

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

            {/* CHECK-INS TIMELINE */}
            <div
              className="lg:col-span-2 rounded-xl border p-4 sm:p-5"
              style={{
                background: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
                Check-ins ao longo do tempo
              </h2>

              <div className="relative h-48 sm:h-56">
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="border-t"
                      style={{ borderColor: theme.colors.borderSoft }}
                    />
                  ))}
                </div>

                <div className="absolute inset-0 flex items-end justify-between px-2 sm:px-3 pb-8 gap-1">
                  {checkins.length > 0 ? (
                    checkins.map((point: any, i: number) => (
                      <div
                        key={i}
                        className="relative flex-1 flex flex-col items-center group"
                      >
                        <div
                          className="absolute w-2 h-2 rounded-full"
                          style={{
                            background: theme.colors.primary,
                            bottom: `${point.percentage}%`,
                            boxShadow: `0 0 10px ${theme.colors.primary}80`,
                          }}
                        />

                        <div
                          className="absolute bottom-0 w-1 rounded-full"
                          style={{
                            height: `${point.percentage}%`,
                            background: theme.colors.primary,
                          }}
                        />

                        <span
                          className="absolute bottom-[-22px] text-[10px] sm:text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: theme.colors.text }}
                        >
                          {point.label}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: theme.colors.text }}>
                      Sem dados
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* OCCUPANCY DISTRIBUTION */}
            <div
              className="rounded-xl border p-4 sm:p-5"
              style={{
                background: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
                Ocupação
              </h2>

              <div className="space-y-3">
                {occupancy.length > 0 ? (
                  occupancy.map((item: any) => (
                    <div key={item.occupancy} className="space-y-1">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span style={{ color: theme.colors.text }}>
                          {getOccupancyLabel(item.occupancy)}
                        </span>
                        <span className="text-white font-semibold">
                          {item.count}
                        </span>
                      </div>

                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ background: theme.colors.borderSoft }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${item.percentage}%`,
                            background: getOccupancyColor(item.occupancy),
                          }}
                        />
                      </div>

                      <div className="text-xs" style={{ color: theme.colors.text }}>
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-center py-4" style={{ color: theme.colors.text }}>
                    Sem dados
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* DETAILED LISTS */}
          {/* ================================================================ */}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            {/* TOP PLACES */}
            <DataContainer title="Locais mais visitados">
              {places.length > 0 ? (
                <div className="space-y-2">
                  {places.map((place: any, idx: number) => (
                    <div
                      key={place.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: theme.colors.background }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white truncate">
                          {idx + 1}. {place.name}
                        </div>
                        <div className="text-xs mt-1" style={{ color: theme.colors.text }}>
                          ⭐ {place.avgRating}
                        </div>
                      </div>

                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-xs sm:text-sm font-semibold text-white">
                          {place.checkins}
                        </div>
                        <div className="text-xs" style={{ color: theme.colors.text }}>
                          {place.percentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-center py-6" style={{ color: theme.colors.text }}>
                  Sem dados
                </div>
              )}
            </DataContainer>

            {/* TOP RATED PLACES */}
            <DataContainer title="Locais melhor avaliados">
              {ratedPlaces.length > 0 ? (
                <div className="space-y-2">
                  {ratedPlaces.map((place: any, idx: number) => (
                    <div
                      key={place.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: theme.colors.background }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white truncate">
                          {idx + 1}. {place.name}
                        </div>
                        <div className="text-xs mt-1" style={{ color: theme.colors.text }}>
                          {place.checkinsCount} check-ins
                        </div>
                      </div>

                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-xs sm:text-sm font-semibold text-white">
                          ⭐ {place.avgRating}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-center py-6" style={{ color: theme.colors.text }}>
                  Sem dados
                </div>
              )}
            </DataContainer>
          </section>

          {/* ================================================================ */}
          {/* MOST ACTIVE USERS */}
          {/* ================================================================ */}

          <section className="grid grid-cols-1 gap-4 mb-6">

            <DataContainer title="Usuários mais ativos">
              {activeUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {activeUsers.map((user: any, idx: number) => (
                    <div
                      key={user.id}
                      className="p-3 rounded-lg text-center"
                      style={{ background: theme.colors.background }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold text-white"
                        style={{
                          background: theme.colors.primary,
                          opacity: 1 - (idx * 0.15),
                        }}
                      >
                        {idx + 1}
                      </div>

                      <div className="text-xs sm:text-sm font-medium text-white truncate">
                        {user.name}
                      </div>

                      <div className="text-xs mt-2" style={{ color: theme.colors.text }}>
                        {user.checkins} check-ins
                      </div>

                      <div className="text-xs mt-1" style={{ color: theme.colors.primary }}>
                        ⭐ {user.avgRating}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-center py-6" style={{ color: theme.colors.text }}>
                  Sem dados
                </div>
              )}
            </DataContainer>
          </section>

          {/* ================================================================ */}
          {/* FOOTER */}
          {/* ================================================================ */}

          <div
            className="text-center text-xs py-4"
            style={{ color: theme.colors.text }}
          >
            Dados atualizados em tempo real
          </div>
        </div>

        {isMobile && <BottomNav />}
      </main>
    </div>
  );
}

/* ========================================================================== */
/* COMPONENTS */
/* ========================================================================== */

function StatCard({ icon, label, value }: any) {
  return (
    <div
      className="rounded-lg border p-3 sm:p-4"
      style={{
        background: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <div
        className="flex items-center gap-2 mb-2"
        style={{ color: theme.colors.primary }}
      >
        {icon}
      </div>

      <div className="text-lg sm:text-2xl font-bold text-white">
        {value}
      </div>

      <div className="text-xs mt-1" style={{ color: theme.colors.text }}>
        {label}
      </div>
    </div>
  );
}

function DataContainer({ title, children }: any) {
  return (
    <div
      className="rounded-xl border p-4 sm:p-5"
      style={{
        background: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
        {title}
      </h2>

      {children}
    </div>
  );
}