import { useMemo, useState } from "react";
import { useLocation } from "wouter";

import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";

import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";

import { DesktopSidebar } from "@/components/DesktopUI";
import { BottomNav, MobileHeader } from "@/components/MobileUI";

import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  Flame,
  Gauge,
  MapPin,
  Menu,
  RefreshCcw,
  Star,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

type DateRange = {
  start: string;
  end: string;
};

type TimeRange = "day" | "week" | "month" | "year";

type MetricId =
  | "users"
  | "checkins"
  | "places"
  | "active"
  | "rating"
  | "performance";

type MetricDetail = {
  label: string;
  value: string | number;
};

type MetricCardData = {
  id: MetricId;
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
  details: MetricDetail[];
  actionLabel?: string;
  onAction?: () => void;
};

const EMPTY_DATE_RANGE: DateRange = {
  start: "",
  end: "",
};

const timeRangeOptions: Array<{
  value: TimeRange;
  label: string;
}> = [
  { value: "day", label: "Hoje" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "year", label: "Este ano" },
];

function formatDateToInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function subtractDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function getTodayInputDate() {
  return formatDateToInput(new Date());
}

function getRangeFromToday(range: TimeRange): DateRange {
  const today = new Date();

  const daysByRange: Record<TimeRange, number> = {
    day: 0,
    week: 6,
    month: 29,
    year: 364,
  };

  return {
    start: formatDateToInput(subtractDays(today, daysByRange[range])),
    end: formatDateToInput(today),
  };
}

function clampEndDate(value: string, today: string) {
  if (!value) return value;
  return value > today ? today : value;
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

export default function Reports() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const isMobile = useIsMobile();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedQuickRange, setSelectedQuickRange] = useState<TimeRange | null>(
    null
  );
  const [expandedMetric, setExpandedMetric] = useState<MetricId | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_DATE_RANGE);

  const today = useMemo(() => getTodayInputDate(), []);

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

  const dashboardMetrics = useMemo<MetricCardData[]>(() => {
    const highestCheckinPlace = places[0];
    const bestRatedPlace = ratedPlaces[0];
    const mostActiveUser = activeUsers[0];

    const totalUsers = Number(stats.totalUsers || 0);
    const activeUsersCount = Number(stats.activeUsers || 0);
    const totalCheckins = Number(stats.totalCheckins || 0);
    const avgRating = Number(stats.avgRating || 0);

    const activeRate =
      totalUsers > 0 ? (activeUsersCount / totalUsers) * 100 : 0;

    const checkinsPerActiveUser =
      activeUsersCount > 0 ? totalCheckins / activeUsersCount : 0;

    const occupancyRecords = occupancy.reduce(
      (total: number, item: any) => total + Number(item.count || 0),
      0
    );

    const performanceScore = Math.min(
      Math.round(
        activeRate * 0.35 +
          Math.min(checkinsPerActiveUser * 10, 35) +
          Math.min(avgRating * 6, 30)
      ),
      100
    );

    return [
      {
        id: "users",
        icon: <Users size={24} />,
        label: "Usuários",
        value: stats.totalUsers,
        description: "Total de contas cadastradas",
        details: [
          { label: "Usuários ativos", value: stats.activeUsers },
          {
            label: "Inativos estimados",
            value: Math.max(totalUsers - activeUsersCount, 0),
          },
          { label: "Taxa ativa", value: `${activeRate.toFixed(0)}%` },
          { label: "Top usuário", value: mostActiveUser?.name ?? "Sem dados" },
        ],
        actionLabel: "Ver usuários",
        onAction: () => setLocation("/usuarios"),
      },
      {
        id: "checkins",
        icon: <Activity size={24} />,
        label: "Check-ins",
        value: stats.totalCheckins,
        description: "Registros feitos no período",
        details: [
          { label: "Total no período", value: stats.totalCheckins },
          {
            label: "Média por usuário ativo",
            value: checkinsPerActiveUser.toFixed(1),
          },
          {
            label: "Local mais visitado",
            value: highestCheckinPlace?.name ?? "Sem dados",
          },
          { label: "Pontos no gráfico", value: checkins.length },
        ],
      },
      {
        id: "places",
        icon: <MapPin size={24} />,
        label: "Locais",
        value: stats.totalPlaces,
        description: "Locais cadastrados na plataforma",
        details: [
          { label: "Locais cadastrados", value: stats.totalPlaces },
          {
            label: "Mais visitado",
            value: highestCheckinPlace?.name ?? "Sem dados",
          },
          {
            label: "Melhor avaliado",
            value: bestRatedPlace?.name ?? "Sem dados",
          },
          { label: "Ocupação registrada", value: occupancyRecords },
        ],
      },
      {
        id: "active",
        icon: <TrendingUp size={24} />,
        label: "Ativos",
        value: stats.activeUsers,
        description: "Usuários ativos no período",
        details: [
          { label: "Ativos no período", value: stats.activeUsers },
          { label: "Participação ativa", value: `${activeRate.toFixed(0)}%` },
          {
            label: "Usuário mais ativo",
            value: mostActiveUser?.name ?? "Sem dados",
          },
          {
            label: "Check-ins do top usuário",
            value: mostActiveUser?.checkins ?? 0,
          },
        ],
      },
      {
        id: "rating",
        icon: <Star size={24} />,
        label: "Rating",
        value: avgRating.toFixed(1),
        description: "Média geral de avaliações",
        details: [
          { label: "Média geral", value: avgRating.toFixed(1) },
          { label: "Melhor local", value: bestRatedPlace?.name ?? "Sem dados" },
          {
            label: "Rating do melhor local",
            value: bestRatedPlace?.avgRating ?? "0.0",
          },
          {
            label: "Check-ins do melhor local",
            value: bestRatedPlace?.checkinsCount ?? 0,
          },
        ],
      },
      {
        id: "performance",
        icon: <Zap size={24} />,
        label: "Performance",
        value: `${performanceScore}%`,
        description: "Saúde geral da plataforma no período",
        details: [
          { label: "Score geral", value: `${performanceScore}%` },
          { label: "Taxa de usuários ativos", value: `${activeRate.toFixed(0)}%` },
          {
            label: "Check-ins por ativo",
            value: checkinsPerActiveUser.toFixed(1),
          },
          { label: "Ocupações registradas", value: occupancyRecords },
        ],
      },
    ];
  }, [activeUsers, checkins.length, occupancy, places, ratedPlaces, setLocation, stats]);

  function updateDateRange(field: keyof DateRange, value: string) {
    setSelectedQuickRange(null);

    setDateRange((prev) => {
      const safeValue = field === "end" ? clampEndDate(value, today) : value;

      if (field === "start") {
        return {
          start: safeValue,
          end: prev.end && safeValue && safeValue > prev.end ? safeValue : prev.end,
        };
      }

      return {
        start:
          prev.start && safeValue && prev.start > safeValue ? safeValue : prev.start,
        end: safeValue,
      };
    });
  }

  function handleQuickRangeChange(range: TimeRange) {
    setSelectedQuickRange(range);
    setDateRange(getRangeFromToday(range));
  }

  function clearFilters() {
    setSelectedQuickRange(null);
    setDateRange(EMPTY_DATE_RANGE);
  }

  function toggleMetric(metric: MetricId) {
    setExpandedMetric((current) => (current === metric ? null : metric));
  }

  const expandedMetricData = dashboardMetrics.find(
    (metric) => metric.id === expandedMetric
  );

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
                aria-label="Abrir menu mobile"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          )}

          <ReportsHero
            stats={stats}
            onBack={() => setLocation("/admin")}
          />

          <Panel
            title="Filtros"
            description="Refine os dados por período ou intervalo personalizado."
          >
            <FiltersBar
              dateRange={dateRange}
              today={today}
              selectedQuickRange={selectedQuickRange}
              onDateChange={updateDateRange}
              onQuickRangeChange={handleQuickRangeChange}
              onClear={clearFilters}
            />
          </Panel>

          <DashboardMetrics
            metrics={dashboardMetrics}
            expandedMetric={expandedMetric}
            expandedMetricData={expandedMetricData}
            onToggleMetric={toggleMetric}
          />

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
              <OccupancyList occupancy={occupancy} />
            </Panel>
          </section>

          <section className="mb-5 grid gap-5 xl:grid-cols-2">
            <Panel
              title="Locais mais visitados"
              description="Ranking por volume de check-ins."
            >
              <PlacesRanking
                places={places}
                emptyMessage="Sem locais visitados no período."
                getMeta={(place) => `⭐ ${place.avgRating}`}
                getValue={(place) => place.checkins}
                getSubValue={(place) =>
                  `${Number(place.percentage || 0).toFixed(0)}%`
                }
              />
            </Panel>

            <Panel
              title="Locais melhor avaliados"
              description="Ranking por média de avaliação."
            >
              <PlacesRanking
                places={ratedPlaces}
                emptyMessage="Sem avaliações no período."
                getMeta={(place) => `${place.checkinsCount} check-ins`}
                getValue={(place) => `⭐ ${place.avgRating}`}
              />
            </Panel>
          </section>

          <Panel
            title="Usuários mais ativos"
            description="Contas com maior volume de check-ins e avaliações."
          >
            <ActiveUsersGrid users={activeUsers} />
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

function ReportsHero({
  stats,
  onBack,
}: {
  stats: {
    totalCheckins: number;
    activeUsers: number;
    avgRating: number;
  };
  onBack: () => void;
}) {
  return (
    <header className="mb-6 overflow-hidden rounded-[34px] border border-emerald-400/35 bg-[#050b10]/95 p-5 shadow-[0_0_38px_rgba(0,255,100,0.12)] sm:p-7">
      <div className="relative">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={onBack}
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
  );
}

function FiltersBar({
  dateRange,
  today,
  selectedQuickRange,
  onDateChange,
  onQuickRangeChange,
  onClear,
}: {
  dateRange: DateRange;
  today: string;
  selectedQuickRange: TimeRange | null;
  onDateChange: (field: keyof DateRange, value: string) => void;
  onQuickRangeChange: (range: TimeRange) => void;
  onClear: () => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
      <DateInput
        label="Data inicial"
        value={dateRange.start}
        max={dateRange.end || today}
        onChange={(value) => onDateChange("start", value)}
      />

      <DateInput
        label="Data final"
        value={dateRange.end}
        max={today}
        onChange={(value) => onDateChange("end", value)}
      />

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/65">
          <Filter size={17} className="text-emerald-400" />
          Período rápido
        </label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {timeRangeOptions.map((option) => (
            <QuickRangeButton
              key={option.value}
              active={selectedQuickRange === option.value}
              label={option.label}
              onClick={() => onQuickRangeChange(option.value)}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="mt-auto flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-emerald-400/70 bg-emerald-400/5 px-5 font-bold text-emerald-400 transition hover:bg-emerald-400 hover:text-black"
      >
        <RefreshCcw size={18} />
        Limpar
      </button>
    </div>
  );
}

function DashboardMetrics({
  metrics,
  expandedMetric,
  expandedMetricData,
  onToggleMetric,
}: {
  metrics: MetricCardData[];
  expandedMetric: MetricId | null;
  expandedMetricData?: MetricCardData;
  onToggleMetric: (metric: MetricId) => void;
}) {
  if (!expandedMetric || !expandedMetricData) {
    return (
      <section className="my-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => (
          <ExpandableStatCard
            key={metric.id}
            metric={metric}
            expanded={false}
            featured={false}
            onToggle={() => onToggleMetric(metric.id)}
          />
        ))}
      </section>
    );
  }

  return (
    <section className="my-5 space-y-4">
      <ExpandableStatCard
        metric={expandedMetricData}
        expanded
        featured
        onToggle={() => onToggleMetric(expandedMetricData.id)}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((metric) => (
          <MetricMiniButton
            key={metric.id}
            metric={metric}
            active={expandedMetric === metric.id}
            onClick={() => onToggleMetric(metric.id)}
          />
        ))}
      </div>
    </section>
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
  max,
  onChange,
}: {
  label: string;
  value: string;
  max?: string;
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
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400 focus:shadow-[0_0_18px_rgba(0,255,100,0.18)]"
      />
    </div>
  );
}

function QuickRangeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-h-[48px] rounded-2xl border px-3 text-sm font-bold transition",
        active
          ? "border-emerald-400 bg-emerald-400 text-black shadow-[0_0_22px_rgba(0,255,100,0.3)]"
          : "border-white/10 bg-black/30 text-white/60 hover:border-emerald-400/70 hover:text-emerald-400",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ExpandableStatCard({
  metric,
  expanded,
  featured,
  onToggle,
}: {
  metric: MetricCardData;
  expanded: boolean;
  featured: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      className={[
        "rounded-[28px] border bg-[#050b10]/95 shadow-[0_0_30px_rgba(0,0,0,0.35)] transition-all duration-300",
        expanded
          ? "border-emerald-400/70 p-5 shadow-[0_0_34px_rgba(0,255,100,0.18)] lg:p-7"
          : "border-white/10 p-5 hover:border-emerald-400/45 hover:shadow-[0_0_26px_rgba(0,255,100,0.1)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-emerald-400/60 bg-emerald-400/10 text-emerald-400">
            {metric.icon}
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/45 transition hover:border-emerald-400 hover:text-emerald-400">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/40">
          {metric.label}
        </p>

        <h3 className="mt-2 text-4xl font-black text-white">{metric.value}</h3>

        <p className="mt-2 text-sm leading-relaxed text-white/45">
          {metric.description}
        </p>
      </button>

      {expanded && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div
            className={[
              "grid gap-3",
              featured ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2",
            ].join(" ")}
          >
            {metric.details.map((detail) => (
              <MetricDetailCard key={detail.label} detail={detail} />
            ))}
          </div>

          {metric.actionLabel && metric.onAction && (
            <button
              type="button"
              onClick={metric.onAction}
              className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-emerald-400 px-4 text-sm font-black text-black transition hover:bg-emerald-300"
            >
              {metric.actionLabel}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function MetricDetailCard({ detail }: { detail: MetricDetail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">
        {detail.label}
      </p>
      <p className="mt-1 truncate text-base font-black text-white">
        {detail.value}
      </p>
    </div>
  );
}

function MetricMiniButton({
  metric,
  active,
  onClick,
}: {
  metric: MetricCardData;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex min-h-[104px] flex-col items-center justify-center rounded-[24px] border p-3 text-center transition-all",
        active
          ? "border-emerald-400 bg-emerald-400/12 shadow-[0_0_22px_rgba(0,255,100,0.18)]"
          : "border-white/10 bg-[#050b10]/90 hover:border-emerald-400/60 hover:bg-emerald-400/5",
      ].join(" ")}
    >
      <div
        className={[
          "mb-2 flex h-10 w-10 items-center justify-center rounded-2xl border transition",
          active
            ? "border-emerald-400 bg-emerald-400 text-black"
            : "border-emerald-400/40 bg-emerald-400/10 text-emerald-400 group-hover:border-emerald-400",
        ].join(" ")}
      >
        {metric.icon}
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
        {metric.label}
      </p>

      <p className="mt-1 text-xl font-black text-white">{metric.value}</p>
    </button>
  );
}

function CheckinsChart({ data }: { data: any[] }) {
  if (!data.length) {
    return (
      <div className="relative h-72 overflow-hidden rounded-[28px] border border-white/10 bg-black/25 p-4">
        <EmptyState message="Sem check-ins no período selecionado." />
      </div>
    );
  }

  return (
    <div className="relative h-72 overflow-hidden rounded-[28px] border border-white/10 bg-black/25 p-4">
      <div className="absolute inset-x-4 bottom-12 top-4 flex flex-col justify-between">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="border-t border-white/10" />
        ))}
      </div>

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
    </div>
  );
}

function OccupancyList({ occupancy }: { occupancy: any[] }) {
  if (!occupancy.length) {
    return <EmptyState message="Sem dados de ocupação no período." />;
  }

  return (
    <div className="space-y-4">
      {occupancy.map((item: any) => (
        <OccupancyRow
          key={item.occupancy}
          label={getOccupancyLabel(item.occupancy)}
          count={item.count}
          percentage={item.percentage}
          color={getOccupancyColor(item.occupancy)}
        />
      ))}
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
  const safePercentage = Math.min(Math.max(Number(percentage || 0), 0), 100);

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
            {safePercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${safePercentage}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function PlacesRanking({
  places,
  emptyMessage,
  getMeta,
  getValue,
  getSubValue,
}: {
  places: any[];
  emptyMessage: string;
  getMeta: (place: any) => string;
  getValue: (place: any) => string | number;
  getSubValue?: (place: any) => string;
}) {
  if (!places.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-3">
      {places.map((place: any, index: number) => (
        <PlaceRankingRow
          key={place.id}
          index={index}
          name={place.name}
          meta={getMeta(place)}
          value={getValue(place)}
          subValue={getSubValue?.(place)}
        />
      ))}
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

function ActiveUsersGrid({ users }: { users: any[] }) {
  if (!users.length) {
    return <EmptyState message="Sem usuários ativos no período." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {users.map((user: any, index: number) => (
        <ActiveUserCard
          key={user.id}
          index={index}
          name={user.name}
          checkins={user.checkins}
          avgRating={user.avgRating}
        />
      ))}
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