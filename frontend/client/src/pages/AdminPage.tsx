/**
 * @file AdminPage.tsx
 * @description Painel administrativo da plataforma.
 * Exibe métricas gerais (locais, usuários, atividade), acesso rápido a funcionalidades
 * administrativas, lista de usuários recentes e locais em destaque.
 * Acessível apenas para usuários com role "admin".
 */

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

/* ================================================== */
/* TIPOS */
/* ================================================== */

/** Estatísticas gerais da plataforma */
type SummaryStats = {
  totalUsers: number;
  totalCheckins: number;
  totalPlaces: number;
  activeUsers: number;
  avgRating: number;
};

/** Dados de um usuário na listagem administrativa */
type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
  actionsCount?: number | null;
};

/** Dados de um local no ranking administrativo */
type AdminPlace = {
  id: number;
  name: string;
  checkins: number;
  avgRating: number;
  percentage: number;
};

/* Intervalo de datas vazio — usado para queries sem filtro de data */
const EMPTY_DATE_RANGE = { startDate: "", endDate: "" };

/* ================================================== */
/* PÁGINA PRINCIPAL */
/* ================================================== */

/**
 * @component Admin
 * @description Painel administrativo com métricas, ações rápidas e listas de dados.
 * Calcula métricas derivadas (novos usuários, taxa de atividade) a partir dos dados brutos.
 */
export default function Admin() {
  const [, setLocation] = useLocation();

  /* Calcula o intervalo dos últimos 7 dias para filtrar dados recentes */
  const WEEK_DATE_RANGE = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, []);

  /* Busca estatísticas gerais da plataforma */
  const { data: summaryStats, isLoading: isSummaryLoading } =
    trpc.analytics.summaryStats.useQuery(EMPTY_DATE_RANGE);

  /* Busca lista de todos os usuários */
  const { data: usersData = [], isLoading: isUsersLoading } =
    trpc.users.getAll.useQuery();

  /* Busca os 3 locais mais visitados na última semana */
  const { data: topPlacesData = [], isLoading: isPlacesLoading } =
    trpc.analytics.topPlaces.useQuery({ ...WEEK_DATE_RANGE, limit: 3 });

  /* Consolida as estatísticas com valores padrão para evitar undefined */
  const stats: SummaryStats = {
    totalUsers: Number(summaryStats?.totalUsers ?? 0),
    totalCheckins: Number(summaryStats?.totalCheckins ?? 0),
    totalPlaces: Number(summaryStats?.totalPlaces ?? 0),
    activeUsers: Number(summaryStats?.activeUsers ?? 0),
    avgRating: Number(summaryStats?.avgRating ?? 0),
  };

  /* Calcula usuários cadastrados nos últimos 7 dias */
  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const newUsersLast7Days = useMemo(
    () =>
      usersData.filter((u: AdminUser) => new Date(u.createdAt) >= sevenDaysAgo)
        .length,
    [usersData, sevenDaysAgo]
  );

  /* Calcula a taxa de atividade: percentual de usuários ativos em relação ao total */
  const activityRate = stats.totalUsers > 0
    ? (stats.activeUsers / stats.totalUsers) * 100
    : 0;

  /* Formata os locais em destaque com tipagem correta */
  const topPlaces: AdminPlace[] = (topPlacesData as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    checkins: Number(p.checkinCount ?? 0),
    avgRating: Number(p.avgRating ?? 0),
    percentage: stats.totalCheckins > 0
      ? (Number(p.checkinCount ?? 0) / stats.totalCheckins) * 100
      : 0,
  }));

  /* Exibe os 5 usuários mais recentes */
  const recentUsers: AdminUser[] = [...usersData]
    .sort((a: AdminUser, b: AdminUser) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const isLoading = isSummaryLoading || isUsersLoading || isPlacesLoading;

  /* Funções de navegação para as seções do painel */
  function goBack() { setLocation("/"); }
  function goToCreateEvent() { setLocation("/create-party"); }
  function goToUsers() { setLocation("/users-info"); }
  function goToReports() { setLocation("/Reports"); }

  /* Estado de carregamento */
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

        {/* Cabeçalho: botão voltar, título e botão de criar evento */}
        <header className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4 md:gap-5">
            {/* Botão de voltar ao mapa */}
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

          {/* Botão de ação principal: criar evento */}
          <button
            type="button"
            onClick={goToCreateEvent}
            className="flex min-h-[58px] items-center justify-center gap-3 rounded-3xl bg-emerald-400 px-6 text-lg font-bold text-black shadow-[0_0_30px_rgba(0,255,100,0.42)] transition hover:scale-[1.01] hover:bg-emerald-300"
          >
            <CalendarPlus size={23} />
            Criar evento/local
          </button>
        </header>

        {/* Seção de métricas principais: 3 cards com KPIs */}
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

        {/* Seção de criação de evento e acessos rápidos */}
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

          {/* Acessos rápidos: usuários e relatórios */}
          <Panel title="Acessos rápidos" description="Navegue rapidamente pelas seções.">
            <div className="flex flex-col gap-3">
              <QuickAccessButton
                icon={<UsersRound size={22} />}
                title="Gerenciar usuários"
                description="Visualize e gerencie todos os usuários"
                onClick={goToUsers}
              />
              <QuickAccessButton
                icon={<BarChart3 size={22} />}
                title="Relatórios"
                description="Acesse análises e relatórios detalhados"
                onClick={goToReports}
              />
            </div>
          </Panel>
        </section>

        {/* Seção de dashboards analíticos */}
        <section className="mb-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            dashboard={{
              title: "Usuários",
              description: "Total de usuários cadastrados na plataforma.",
              value: String(stats.totalUsers),
              label: "usuários registrados",
              icon: <UsersRound size={24} />,
            }}
            onClick={goToUsers}
          />
          <DashboardCard
            dashboard={{
              title: "Check-ins",
              description: "Total de check-ins realizados na plataforma.",
              value: String(stats.totalCheckins),
              label: "check-ins realizados",
              icon: <Activity size={24} />,
            }}
            onClick={goToReports}
          />
          <DashboardCard
            dashboard={{
              title: "Avaliação média",
              description: "Média geral de avaliações dos locais.",
              value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—",
              label: "estrelas em média",
              icon: <TrendingUp size={24} />,
            }}
            onClick={goToReports}
          />
        </section>

        {/* Seção de locais em destaque e usuários recentes */}
        <section className="grid gap-5 lg:grid-cols-2">
          {/* Locais mais visitados na última semana */}
          <Panel
            title="Locais em destaque"
            description="Os 3 locais mais visitados nos últimos 7 dias."
          >
            <div className="flex flex-col gap-3">
              {topPlaces.length === 0 ? (
                <p className="text-sm text-white/40">Nenhum dado disponível.</p>
              ) : (
                topPlaces.map((place) => (
                  <PlaceRow key={place.id} place={place} />
                ))
              )}
            </div>
          </Panel>

          {/* Usuários cadastrados mais recentemente */}
          <Panel
            title="Usuários recentes"
            description="Os 5 últimos usuários cadastrados na plataforma."
          >
            <div className="flex flex-col gap-3">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-white/40">Nenhum usuário encontrado.</p>
              ) : (
                recentUsers.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))
              )}
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

/* ================================================== */
/* COMPONENTES INTERNOS */
/* ================================================== */

/**
 * @component Panel
 * @description Container de seção com título, descrição e conteúdo filho.
 * Usado para agrupar visualmente blocos de informação no painel.
 */
function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/45">{description}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * @component MetricCard
 * @description Card de métrica com ícone, título, valor e descrição.
 * Usado na seção de KPIs principais do painel.
 */
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
    <div className="rounded-[26px] border border-white/10 bg-black/25 p-5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/50 bg-emerald-400/10 text-emerald-400">
        {icon}
      </div>
      <p className="text-3xl font-black text-emerald-400">{value}</p>
      <h3 className="mt-2 font-bold text-white">{title}</h3>
      <p className="mt-1 text-sm text-white/45">{description}</p>
    </div>
  );
}

/**
 * @component QuickAccessButton
 * @description Botão de acesso rápido com ícone, título e descrição.
 * Usado na seção de atalhos do painel administrativo.
 */
function QuickAccessButton({
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

/**
 * @component PlaceRow
 * @description Linha de local no ranking administrativo.
 * Exibe nome, número de check-ins, avaliação média e percentual de participação.
 */
function PlaceRow({ place }: { place: AdminPlace }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-400/40 md:grid-cols-[1fr_auto]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-400">
          <MapPin size={22} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-white">{place.name}</h3>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
              Local
            </span>
          </div>
          {/* Métricas do local */}
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

/**
 * @component UserRow
 * @description Linha de usuário na listagem administrativa.
 * Exibe iniciais, nome, email, role e data de cadastro.
 */
function UserRow({ user }: { user: AdminUser }) {
  /* Gera as iniciais do nome (máximo 2 letras) */
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  /* Traduz o role para português */
  const roleLabel =
    user.role === "admin" ? "ADM" :
    user.role === "moderator" ? "Moderador" : "Usuário";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-400/40">
      {/* Avatar com iniciais */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-sm font-black text-emerald-400">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-white">{user.name}</h3>
        <p className="truncate text-sm text-white/45">{user.email}</p>
      </div>
      {/* Role e data de cadastro */}
      <div className="hidden text-right sm:block">
        <p className="text-sm font-bold text-emerald-400">{roleLabel}</p>
        <p className="mt-1 text-xs text-white/35">
          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>
  );
}

/**
 * @component DashboardCard
 * @description Card clicável de dashboard com ícone, título, descrição e valor destacado.
 * Usado na seção de análises do painel administrativo.
 */
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
      {/* Valor numérico em destaque */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
        <p className="text-3xl font-black text-emerald-400">{dashboard.value}</p>
        <p className="mt-1 text-sm text-white/40">{dashboard.label}</p>
      </div>
    </button>
  );
}
