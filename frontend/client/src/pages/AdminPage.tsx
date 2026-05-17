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
  Eye,
  ShieldCheck,
  Activity,
  TrendingUp,
} from "lucide-react";

import { theme } from "@/lib/theme";

const recentEvents = [
  {
    id: 1,
    name: "Neon Pulse",
    type: "Festa",
    date: "Hoje, 23:00",
    location: "Warehouse 21",
    status: "Publicada",
  },
  {
    id: 2,
    name: "Deep House Sessions",
    type: "Festa",
    date: "Sábado, 22:00",
    location: "Club Aurora",
    status: "Rascunho",
  },
  {
    id: 3,
    name: "Galpão Norte",
    type: "Local",
    date: "Funcionamento semanal",
    location: "Centro",
    status: "Ativo",
  },
];

const recentUsers = [
  {
    id: 1,
    name: "Marina Costa",
    email: "marina@email.com",
    role: "Usuário",
    joinedAt: "Hoje",
  },
  {
    id: 2,
    name: "Rafael Lima",
    email: "rafael@email.com",
    role: "Organizador",
    joinedAt: "Ontem",
  },
  {
    id: 3,
    name: "Bianca Torres",
    email: "bianca@email.com",
    role: "Usuário",
    joinedAt: "2 dias atrás",
  },
];

const dashboardCards = [
  {
    title: "Relatório de eventos",
    description: "Visualize festas criadas, locais ativos e publicações recentes.",
    value: "24",
    label: "eventos no mês",
    icon: <PartyPopper size={24} />,
  },
  {
    title: "Relatório de usuários",
    description: "Acompanhe crescimento, novos cadastros e perfis ativos.",
    value: "1.248",
    label: "usuários totais",
    icon: <UsersRound size={24} />,
  },
  {
    title: "Performance geral",
    description: "Veja acessos, engajamento e movimentação da plataforma.",
    value: "+18%",
    label: "crescimento",
    icon: <TrendingUp size={24} />,
  },
];

export default function Admin() {
  const [, setLocation] = useLocation();

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
            title="Eventos ativos"
            value="18"
            description="Festas e locais publicados"
          />

          <MetricCard
            icon={<UsersRound size={24} />}
            title="Novos usuários"
            value="126"
            description="Cadastros recentes"
          />

          <MetricCard
            icon={<Activity size={24} />}
            title="Atividade"
            value="+32%"
            description="Movimento da semana"
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
            title="Últimas festas e locais"
            description="Eventos e locais adicionados recentemente."
            actionLabel="Criar novo"
            onAction={goToCreateEvent}
          >
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <EventRow key={event.id} event={event} />
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

function EventRow({
  event,
}: {
  event: {
    name: string;
    type: string;
    date: string;
    location: string;
    status: string;
  };
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-400/40 md:grid-cols-[1fr_auto]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-400">
          {event.type === "Festa" ? <PartyPopper size={22} /> : <MapPin size={22} />}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-white">{event.name}</h3>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
              {event.type}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/45">
            <span className="flex items-center gap-1.5">
              <Clock size={15} />
              {event.date}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={15} />
              {event.location}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center md:justify-end">
        <span className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm font-bold text-white/60">
          {event.status}
        </span>
      </div>
    </div>
  );
}

function UserRow({
  user,
}: {
  user: {
    name: string;
    email: string;
    role: string;
    joinedAt: string;
  };
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-400/40">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-sm font-black text-emerald-400">
        {user.name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-white">{user.name}</h3>
        <p className="truncate text-sm text-white/45">{user.email}</p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-sm font-bold text-emerald-400">{user.role}</p>
        <p className="mt-1 text-xs text-white/35">{user.joinedAt}</p>
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