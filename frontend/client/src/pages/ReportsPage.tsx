import { useState } from "react";
import { useLocation } from "wouter";

import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";

import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";

import { DesktopSidebar } from "../components/DesktopUI";
import { BottomNav, MobileHeader } from "@/components/MobileUI";

import {
  ArrowLeft,
  Users,
  MapPin,
  BarChart3,
  Star,
  TrendingUp,
  Menu,
  X,
  CalendarDays,
  Activity,
  Flame,
  Trophy,
  Clock3,
  Gauge,
  Filter,
  RefreshCcw,
} from "lucide-react";

type DateRange = {
  start: string;
  end: string;
};

type TimeRange = "day" | "week" | "month" | "year";

const timeRangeOptions: Array<{ value: TimeRange; label: string }> = [
  { value: "day", label: "Hoje" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "year", label: "Este ano" },
];

export default function Reports() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const [dateRange, setDateRange] = useState<DateRange>({
    start: "",
    end: "",
  });

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

  function updateDateRange(field: keyof DateRange, value: string) {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function clearFilters() {
    setDateRange({
      start: "",
      end: "",
    });
    setTimeRange("week");
  }

  function getOccupancyColor(occupancyStatus: string) {
    switch (occupancyStatus) {
      case "empty":
        return "#6B7280";
      case "moderate":
        return theme.colors.primary;
      case "full":
        return "#EF4444";
      default:
        return theme.colors.text;
    }
  }

  function getOccupancyLabel(occupancyStatus: string) {
    switch (occupancyStatus) {
      case "empty":
        return "Vazio";
      case "moderate":
        return "Moderado";
      case "full":
        return "Cheio";
      default:
        return "Desconhecido";
    }
  }

  const statCards = [
    {
      icon: <Users size={24} />,
      label: "Usuários",
      value: stats.totalUsers,
      description: "Total de contas cadastradas",
    },
    {
      icon: <Activity size={24} />,
      label: "Check-ins",
      value: stats.totalCheckins,
      description: "Registros feitos no período",
    },
    {
      icon: <MapPin size={24} />,
      label: "Locais",
      value: stats.totalPlaces,
      description: "Locais cadastrados na plataforma",
    },
    {
      icon: <TrendingUp size={24} />,
      label: "Ativos",
      value: stats.activeUsers,
      description: "Usuários ativos no período",
    },
    {
      icon: <Star size={24} />,
      label: "Rating",
      value: Number(stats.avgRating || 0).toFixed(1),
      description: "Média geral de avaliações",
    },
  ];

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden lg:flex-row"
      style={{ background: theme.colors.background }}
    >
      {!isMobile && <DesktopSidebar />}

      <main className="flex-1 overflow-y-auto">
        <div className="px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-10 lg:pb-10 lg:pt-10">
          {isMobile && (
            <div className="mb-6 flex items-center justify-between">
              <MobileHeader
                isAuthenticated={isAuthenticated}
                onProfile={() => setLocation("/profile")}
                onLogin={() => setLocation("/login")}
              />

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-emerald-400 transition hover:border-emerald-400"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          )}

          <header className="mb-6 overflow-hidden rounded-[34px] border border-emerald-400/35 bg-[#050b10]/95 p-5 shadow-[0_0_38px_rgba(0,255,100,0.12)] sm:p-7">
            <div className="relative">
              <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />

              <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setLocation("/admin")}
                    className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/75 transition hover:border-emerald-400 hover:text-emerald-400 hover:shadow-[0_0_22px_rgba(0,255,100,0.25)] sm:h-14 sm:w-14"
                    aria-label="Voltar para admin"
                  >
                    <ArrowLeft size={25} />
                  </button>

                  <div>
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-emerald-400">
                      <BarChart3 size={18} />
                      Painel de relatórios
                    </p>

                    <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                      Analytics
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base">
                      Visão geral do desempenho do JoinMe, com check-ins, usuários,
                      ocupação, locais em destaque e avaliações em tempo real.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                  <HeroMiniCard
                    icon={<Flame size={20} />}
                    label="Check-ins"
                    value={stats.totalCheckins}
                  />

                  <HeroMiniCard
                    icon={<Users size={20} />}
                    label="Ativos"
                    value={stats.activeUsers}
                  />

                  <HeroMiniCard
                    icon={<Star size={20} />}
                    label="Rating"
                    value={Number(stats.avgRating || 0).toFixed(1)}
                  />
                </div>
              </div>
            </div>
          </header>

          <Panel title="Filtros" description="Refine os dados por período ou intervalo personalizado.">
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
              <DateInput
                label="Data inicial"
                value={dateRange.start}
                onChange={(value) => updateDateRange("start", value)}
              />

              <DateInput
                label="Data final"
                value={dateRange.end}
                onChange={(value) => updateDateRange("end", value)}
              />

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/65">
                  <Filter size={17} className="text-emerald-400" />
                  Período rápido
                </label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {timeRangeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTimeRange(option.value)}
                      className={[
                        "min-h-[48px] rounded-2xl border px-3 text-sm font-bold transition",
                        timeRange === option.value
                          ? "border-emerald-400 bg-emerald-400 text-black shadow-[0_0_22px_rgba(0,255,100,0.3)]"
                          : "border-white/10 bg-black/30 text-white/60 hover:border-emerald-400/70 hover:text-emerald-400",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-auto flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-emerald-400/70 bg-emerald-400/5 px-5 font-bold text-emerald-400 transition hover:bg-emerald-400 hover:text-black"
              >
                <RefreshCcw size={18} />
                Limpar
              </button>
            </div>
          </Panel>

          <section className="my-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {statCards.map((stat) => (
              <StatCard
                key={stat.label}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                description={stat.description}
              />
            ))}
          </section>

          <section className="mb-5 grid gap-5 xl:grid-cols-[1.45fr_0.8fr]">
            <Panel
              title="Check-ins ao longo do tempo"
              description="Evolução dos registros no período selecionado."
            >
              <CheckinsChart data={checkins} />
            </Panel>

            <Panel
              title="Distribuição de ocupação"
              description="Proporção entre locais vazios, moderados e cheios."
            >
              <div className="space-y-4">
                {occupancy.length > 0 ? (
                  occupancy.map((item: any) => (
                    <OccupancyRow
                      key={item.occupancy}
                      label={getOccupancyLabel(item.occupancy)}
                      count={item.count}
                      percentage={item.percentage}
                      color={getOccupancyColor(item.occupancy)}
                    />
                  ))
                ) : (
                  <EmptyState message="Sem dados de ocupação no período." />
                )}
              </div>
            </Panel>
          </section>

          <section className="mb-5 grid gap-5 xl:grid-cols-2">
            <Panel
              title="Locais mais visitados"
              description="Ranking por volume de check-ins."
            >
              <div className="space-y-3">
                {places.length > 0 ? (
                  places.map((place: any, index: number) => (
                    <PlaceRankingRow
                      key={place.id}
                      index={index}
                      name={place.name}
                      meta={`⭐ ${place.avgRating}`}
                      value={place.checkins}
                      subValue={`${Number(place.percentage || 0).toFixed(0)}%`}
                    />
                  ))
                ) : (
                  <EmptyState message="Sem locais visitados no período." />
                )}
              </div>
            </Panel>

            <Panel
              title="Locais melhor avaliados"
              description="Ranking por média de avaliação."
            >
              <div className="space-y-3">
                {ratedPlaces.length > 0 ? (
                  ratedPlaces.map((place: any, index: number) => (
                    <PlaceRankingRow
                      key={place.id}
                      index={index}
                      name={place.name}
                      meta={`${place.checkinsCount} check-ins`}
                      value={`⭐ ${place.avgRating}`}
                    />
                  ))
                ) : (
                  <EmptyState message="Sem avaliações no período." />
                )}
              </div>
            </Panel>
          </section>

          <Panel
            title="Usuários mais ativos"
            description="Contas com maior volume de check-ins e avaliações."
          >
            {activeUsers.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {activeUsers.map((user: any, index: number) => (
                  <ActiveUserCard
                    key={user.id}
                    index={index}
                    name={user.name}
                    checkins={user.checkins}
                    avgRating={user.avgRating}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="Sem usuários ativos no período." />
            )}
          </Panel>

          <div className="py-6 text-center text-xs text-white/35">
            Dados atualizados em tempo real
          </div>
        </div>

        {isMobile && <BottomNav />}
      </main>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[#050b10]/95 p-5 shadow-[0_0_35px_rgba(0,0,0,0.42)]">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {description && (
          <p className="text-sm leading-relaxed text-white/45">{description}</p>
        )}
      </div>

      {children}
    </section>
  );
}

function HeroMiniCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/50 bg-emerald-400/10 text-emerald-400">
        {icon}
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/65">
        <CalendarDays size={17} className="text-emerald-400" />
        {label}
      </label>

      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400 focus:shadow-[0_0_18px_rgba(0,255,100,0.18)]"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#050b10]/95 p-5 shadow-[0_0_30px_rgba(0,0,0,0.35)] transition hover:border-emerald-400/45 hover:shadow-[0_0_26px_rgba(0,255,100,0.1)]">
      <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl border border-emerald-400/60 bg-emerald-400/10 text-emerald-400">
        {icon}
      </div>

      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>

      <h3 className="mt-2 text-4xl font-black text-white">{value}</h3>

      <p className="mt-2 text-sm leading-relaxed text-white/45">{description}</p>
    </div>
  );
}

function CheckinsChart({ data }: { data: any[] }) {
  const hasData = data.length > 0;

  return (
    <div className="relative h-72 overflow-hidden rounded-[28px] border border-white/10 bg-black/25 p-4">
      <div className="absolute inset-x-4 bottom-12 top-4 flex flex-col justify-between">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="border-t border-white/10" />
        ))}
      </div>

      {hasData ? (
        <div className="absolute inset-x-4 bottom-10 top-4 flex items-end justify-between gap-2">
          {data.map((point: any, index: number) => {
            const percentage = Number(point.percentage || 0);

            return (
              <div
                key={`${point.label}-${index}`}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
              >
                <div className="absolute -top-2 rounded-xl border border-emerald-400/40 bg-black/85 px-2 py-1 text-xs font-bold text-emerald-400 opacity-0 shadow-[0_0_16px_rgba(0,255,100,0.2)] transition group-hover:opacity-100">
                  {percentage.toFixed(0)}%
                </div>

                <div
                  className="w-full max-w-[28px] rounded-t-2xl bg-emerald-400 shadow-[0_0_18px_rgba(0,255,100,0.35)] transition group-hover:bg-emerald-300"
                  style={{ height: `${Math.max(percentage, 4)}%` }}
                />

                <span className="absolute -bottom-7 max-w-[58px] truncate text-[11px] text-white/40">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState message="Sem check-ins no período selecionado." />
      )}
    </div>
  );
}

function OccupancyRow({
  label,
  count,
  percentage,
  color,
}: {
  label: string;
  count: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="h-3 w-3 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.24)]"
            style={{ background: color }}
          />
          <p className="font-bold text-white">{label}</p>
        </div>

        <div className="text-right">
          <p className="font-black text-white">{count}</p>
          <p className="text-xs text-white/35">
            {Number(percentage || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(Math.max(Number(percentage || 0), 0), 100)}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function PlaceRankingRow({
  index,
  name,
  meta,
  value,
  subValue,
}: {
  index: number;
  name: string;
  meta: string;
  value: string | number;
  subValue?: string;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-400/45 md:grid-cols-[1fr_auto]">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/50 bg-emerald-400/10 text-sm font-black text-emerald-400">
          {index + 1}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-bold text-white">{name}</h3>
          <p className="mt-1 text-sm text-white/45">{meta}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 md:block md:text-right">
        <p className="text-lg font-black text-white">{value}</p>
        {subValue && <p className="mt-1 text-sm text-emerald-400">{subValue}</p>}
      </div>
    </div>
  );
}

function ActiveUserCard({
  index,
  name,
  checkins,
  avgRating,
}: {
  index: number;
  name: string;
  checkins: number;
  avgRating: number;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-black/25 p-5 text-center transition hover:border-emerald-400/50 hover:bg-emerald-400/5">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400 bg-emerald-400 text-lg font-black text-black shadow-[0_0_24px_rgba(0,255,100,0.32)]">
        {index + 1}
      </div>

      <div className="mb-3 flex items-center justify-center gap-2 text-emerald-400">
        <Trophy size={17} />
        <span className="text-xs font-bold uppercase tracking-[0.18em]">
          Top usuário
        </span>
      </div>

      <h3 className="truncate font-bold text-white">{name}</h3>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
          <Clock3 className="mx-auto mb-1 text-emerald-400" size={17} />
          <p className="text-sm font-black text-white">{checkins}</p>
          <p className="text-[11px] text-white/35">check-ins</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
          <Star className="mx-auto mb-1 text-emerald-400" size={17} />
          <p className="text-sm font-black text-white">{avgRating}</p>
          <p className="text-[11px] text-white/35">rating</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
      <Gauge size={28} className="mb-3 text-emerald-400/80" />
      <p className="text-sm font-semibold text-white/55">{message}</p>
    </div>
  );
}