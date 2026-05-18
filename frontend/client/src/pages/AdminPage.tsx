import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  CalendarPlus,
  UsersRound,
  BarChart3,
  PartyPopper,
  MapPin,
  Clock,
  ChevronRight,
  Activity,
  TrendingUp,
  Star,
} from "lucide-react";

import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";

type SummaryStats = {
  totalUsers: number;
  totalCheckins: number;
  totalPlaces: number;
  activeUsers: number;
  avgRating: number;
};

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
  actionsCount?: number | null;
};

type AdminPlace = {
  id: number;
  name: string;
  checkins: number;
  avgRating: number;
  percentage: number;
};

const EMPTY_DATE_RANGE = { startDate: "", endDate: "" };



export default function Admin() {
  const [, setLocation] = useLocation();

  const WEEK_DATE_RANGE = useMemo(() => {
    const end = new Date();
  
    const start = new Date();
    start.setDate(start.getDate() - 7);
  
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, []);

  const {
    data: summaryStats,
    isLoading: isSummaryLoading,
  } = trpc.analytics.summaryStats.useQuery(EMPTY_DATE_RANGE);

  const {
    data: usersData = [],
    isLoading: isUsersLoading,
  } = trpc.users.getAll.useQuery();

  const {
    data: topPlacesData = [],
    isLoading: isPlacesLoading,
  } = trpc.analytics.topPlaces.useQuery({
  ...WEEK_DATE_RANGE,
  limit: 3,
});

  const stats: SummaryStats = {
    totalUsers: summaryStats?.totalUsers ?? 0,
    totalCheckins: summaryStats?.totalCheckins ?? 0,
    totalPlaces: summaryStats?.totalPlaces ?? 0,
    activeUsers: summaryStats?.activeUsers ?? 0,
    avgRating: Number(summaryStats?.avgRating ?? 0),
  };

  const recentUsers = useMemo(() => {
    return [...usersData]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 3)
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        actionsCount: user.actionsCount ?? 0,
      })) as AdminUser[];
  }, [usersData]);

  const topPlaces = useMemo(() => {
    return [...topPlacesData]
      .slice(0, 3)
      .map((place) => ({
        id: place.id,
        name: place.name,
        checkins: place.checkins ?? 0,
        avgRating: Number(place.avgRating ?? 0),
        percentage: place.percentage ?? 0,
      })) as AdminPlace[];
  }, [topPlacesData]);

  const activityRate =
    stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0;

  const newUsersLast7Days = useMemo(() => {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 7);

    return usersData.filter((user) => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= limitDate;
    }).length;
  }, [usersData]);

  const performanceScore = useMemo(() => {
    const checkinsScore = Math.min(stats.totalCheckins / 10, 40);
    const activityScore = Math.min(activityRate * 0.4, 35);
    const ratingScore = Math.min(stats.avgRating * 6, 25);

    return Math.min(Math.round(checkinsScore + activityScore + ratingScore), 100);
  }, [activityRate, stats.avgRating, stats.totalCheckins]);

  const dashboardCards = useMemo(
    () => [
      {
        title: "Relatório de eventos",
        description: "Locais cadastrados e mais movimentados no sistema.",
        value: String(stats.totalPlaces),
        label: "locais cadastrados",
        icon: <PartyPopper size={24} />,
      },
      {
        title: "Relatório de usuários",
        description: "Cadastros totais e usuários recentes na plataforma.",
        value: String(stats.totalUsers),
        label: "usuários totais",
        icon: <UsersRound size={24} />,
      },
      {
        title: "Performance geral",
        description: "Combinação de atividade, check-ins e avaliações.",
        value: `${performanceScore}%`,
        label: "índice da plataforma",
        icon: <TrendingUp size={24} />,
      },
    ],
    [performanceScore, stats.totalPlaces, stats.totalUsers]
  );

  const isLoading = isSummaryLoading || isUsersLoading || isPlacesLoading;

  function goBack() {
    setLocation("/");
  }

  function goToCreateEvent() {
    setLocation("/create-party");
  }

  function goToUsers() {
    setLocation("/users-info");
  }

  function goToReports() {
    setLocation("/Reports");
  }

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-white"
        style={{ background: theme.colors.background }}
      >
        Carregando painel administrativo...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen overflow-y-auto px-4 py-6 md:px-8"
      style={{ background: theme.colors.background }}
    >
      <div className="mx-auto max-w-7xl pb-10">
        <header className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4 md:gap-5">
            <button
              type="button"
              onClick={goBack}
              className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/75 transition hover:border-emerald-400 hover:text-emerald-400 hover:shadow-[0_0_22px_rgba(0,255,100,0.25)] md:h-14 md:w-14"
            >
              <ArrowLeft size={25} />
            </button>

            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-emerald-400">
                Painel administrativo
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                Admin
              </h1>

              <p className="mt-2 max-w-2xl text-base text-white/55 md:text-lg">
                Gerencie eventos, acompanhe usuários recentes e acesse relatórios da plataforma.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={goToCreateEvent}
            className="flex min-h-[58px] items-center justify-center gap-3 rounded-3xl bg-emerald-400 px-6 text-lg font-bold text-black shadow-[0_0_30px_rgba(0,255,100,0.42)] transition hover:scale-[1.01] hover:bg-emerald-300"
          >
            <CalendarPlus size={23} />
            Criar evento/local
          </button>
        </header>

        <section className="mb-5 grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={<PartyPopper size={24} />}
            title="Locais cadastrados"
            value={String(stats.totalPlaces)}
            description="Festas e locais disponíveis"
          />

          <MetricCard
            icon={<UsersRound size={24} />}
            title="Novos usuários"
            value={String(newUsersLast7Days)}
            description="Cadastros nos últimos 7 dias"
          />

          <MetricCard
            icon={<Activity size={24} />}
            title="Atividade"
            value={`${activityRate.toFixed(0)}%`}
            description="Participação de usuários ativos"
          />
        </section>

        <section className="mb-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel
            title="Criar novo evento"
            description="Use o fluxo já existente de criação de festa ou local."
          >
            <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/40 bg-black/35 p-6">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl" />

              <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-emerald-400 bg-emerald-400 text-black shadow-[0_0_26px_rgba(0,255,100,0.35)]">
                    <CalendarPlus size={30} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Cadastrar festa ou local
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
                      Abra a tela de criação para publicar uma festa com data e horário
                      ou adicionar um local fixo com funcionamento semanal.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={goToCreateEvent}
                  className="flex min-h-[54px] items-center justify-center gap-3 rounded-2xl bg-emerald-400 px-5 font-bold text-black transition hover:bg-emerald-300"
                >
                  Abrir criação
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </Panel>

          <Panel
            title="Acessos rápidos"
            description="Navegue entre as áreas administrativas."
          >
            <div className="grid gap-3">
              <QuickAction
                icon={<CalendarPlus size={22} />}
                title="Criar evento/local"
                description="Ir para tela de cadastro"
                onClick={goToCreateEvent}
              />

              <QuickAction
                icon={<UsersRound size={22} />}
                title="Usuários"
                description="Consultar lista completa"
                onClick={goToUsers}
              />

              <QuickAction
                icon={<BarChart3 size={22} />}
                title="Relatórios"
                description="Abrir dashboards completos"
                onClick={goToReports}
              />
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Panel
            title="Locais em destaque"
            description="Top 3 locais mais movimentados da semana."
            actionLabel="Criar novo"
            onAction={goToCreateEvent}
          >
            <div className="space-y-3">
              {topPlaces.map((place) => (
                <PlaceRow key={place.id} place={place} />
              ))}
            </div>
          </Panel>

          <Panel
            title="Últimos usuários"
            description="Cadastros recentes na plataforma."
            actionLabel="Ver usuários"
            onAction={goToUsers}
          >
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-5">
          <Panel
            title="Dashboards"
            description="Resumo dos principais indicadores administrativos."
            actionLabel="Abrir relatórios"
            onAction={goToReports}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {dashboardCards.map((dashboard) => (
                <DashboardCard
                  key={dashboard.title}
                  dashboard={dashboard}
                  onClick={goToReports}
                />
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[#050b10]/95 p-5 shadow-[0_0_35px_rgba(0,0,0,0.45)]">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-white/45">{description}</p>
          )}
        </div>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-emerald-400/70 bg-emerald-400/5 px-4 text-sm font-bold text-emerald-400 transition hover:bg-emerald-400 hover:text-black"
          >
            {actionLabel}
            <ChevronRight size={17} />
          </button>
        )}
      </div>

      {children}
    </section>
  );
}

function MetricCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#050b10]/95 p-5 shadow-[0_0_30px_rgba(0,0,0,0.35)]">
      <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl border border-emerald-400/60 bg-emerald-400/10 text-emerald-400">
        {icon}
      </div>

      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/40">
        {title}
      </p>

      <h3 className="mt-2 text-4xl font-black text-white">{value}</h3>

      <p className="mt-2 text-sm text-white/45">{description}</p>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-emerald-400/70 hover:bg-emerald-400/5"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-emerald-400 transition group-hover:border-emerald-400">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/45">{description}</p>
      </div>

      <ChevronRight className="text-white/35 group-hover:text-emerald-400" size={20} />
    </button>
  );
}

function PlaceRow({
  place,
}: {
  place: AdminPlace;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-400/40 md:grid-cols-[1fr_auto]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-400">
          <MapPin size={22} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-white">
              {place.name}
            </h3>

            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
              Local
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/45">
            <span className="flex items-center gap-1.5">
              <Activity size={15} />
              {Number(place.checkins ?? 0)} check-ins
            </span>

            <span className="flex items-center gap-1.5">
              <Star size={15} />
              {Number(place.avgRating ?? 0).toFixed(1)}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock size={15} />
              {Number(place.percentage ?? 0).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center md:justify-end">
        <span className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm font-bold text-white/60">
          Em destaque
        </span>
      </div>
    </div>
  );
}

function UserRow({
  user,
}: {
  user: AdminUser;
}) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = user.role === "admin"
    ? "ADM"
    : user.role === "moderator"
      ? "Moderador"
      : "Usuário";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-400/40">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-sm font-black text-emerald-400">
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-white">{user.name}</h3>
        <p className="truncate text-sm text-white/45">{user.email}</p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-sm font-bold text-emerald-400">{roleLabel}</p>
        <p className="mt-1 text-xs text-white/35">
          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>
  );
}

function DashboardCard({
  dashboard,
  onClick,
}: {
  dashboard: {
    title: string;
    description: string;
    value: string;
    label: string;
    icon: React.ReactNode;
  };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[26px] border border-white/10 bg-black/25 p-5 text-left transition hover:border-emerald-400/70 hover:bg-emerald-400/5 hover:shadow-[0_0_24px_rgba(0,255,100,0.16)]"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-emerald-400/50 bg-emerald-400/10 text-emerald-400">
          {dashboard.icon}
        </div>

        <ChevronRight className="text-white/30 transition group-hover:text-emerald-400" size={22} />
      </div>

      <h3 className="text-lg font-bold text-white">{dashboard.title}</h3>

      <p className="mt-2 min-h-[42px] text-sm leading-relaxed text-white/45">
        {dashboard.description}
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
        <p className="text-3xl font-black text-emerald-400">{dashboard.value}</p>
        <p className="mt-1 text-sm text-white/40">{dashboard.label}</p>
      </div>
    </button>
  );
}
