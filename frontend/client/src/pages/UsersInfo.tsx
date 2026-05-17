import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Eye,
  Filter,
  Lock,
  Mail,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

import { theme } from "@/lib/theme";

type AccountRole = "admin" | "moderator" | "user";
type AccountStatus = "active" | "blocked" | "pending";
type FilterRole = "all" | AccountRole;

type UserAccount = {
  id: number;
  name: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  createdAt: string;
  lastSeen: string;
  actionsCount: number;
};

type AdminAction = {
  id: number;
  actor: string;
  actorRole: AccountRole;
  action: string;
  target: string;
  description: string;
  date: string;
  severity: "info" | "warning" | "success";
};

const roleLabels: Record<AccountRole, string> = {
  admin: "ADM",
  moderator: "Moderador",
  user: "Usuário",
};

const statusLabels: Record<AccountStatus, string> = {
  active: "Ativo",
  blocked: "Bloqueado",
  pending: "Pendente",
};

const initialUsers: UserAccount[] = [
  {
    id: 1,
    name: "Matheus Falcão",
    email: "matheus@falcaotecnologia.com.br",
    role: "admin",
    status: "active",
    createdAt: "12 mai 2026",
    lastSeen: "Agora",
    actionsCount: 42,
  },
  {
    id: 2,
    name: "Marina Costa",
    email: "marina@email.com",
    role: "moderator",
    status: "active",
    createdAt: "10 mai 2026",
    lastSeen: "15 min atrás",
    actionsCount: 18,
  },
  {
    id: 3,
    name: "Rafael Lima",
    email: "rafael@email.com",
    role: "user",
    status: "pending",
    createdAt: "09 mai 2026",
    lastSeen: "Ontem",
    actionsCount: 2,
  },
  {
    id: 4,
    name: "Bianca Torres",
    email: "bianca@email.com",
    role: "user",
    status: "active",
    createdAt: "08 mai 2026",
    lastSeen: "2h atrás",
    actionsCount: 7,
  },
  {
    id: 5,
    name: "Lucas Andrade",
    email: "lucas@email.com",
    role: "moderator",
    status: "blocked",
    createdAt: "04 mai 2026",
    lastSeen: "3 dias atrás",
    actionsCount: 11,
  },
];

const timelineActions: AdminAction[] = [
  {
    id: 1,
    actor: "Matheus Falcão",
    actorRole: "admin",
    action: "Criou conta moderadora",
    target: "Marina Costa",
    description: "Permissão concedida para revisar festas, locais e denúncias.",
    date: "Hoje, 14:32",
    severity: "success",
  },
  {
    id: 2,
    actor: "Marina Costa",
    actorRole: "moderator",
    action: "Alterou status de evento",
    target: "Deep House Sessions",
    description: "Evento movido de rascunho para análise antes da publicação.",
    date: "Hoje, 13:08",
    severity: "info",
  },
  {
    id: 3,
    actor: "Matheus Falcão",
    actorRole: "admin",
    action: "Bloqueou conta",
    target: "Lucas Andrade",
    description: "Conta bloqueada após alterações suspeitas em múltiplos eventos.",
    date: "Ontem, 22:41",
    severity: "warning",
  },
  {
    id: 4,
    actor: "Marina Costa",
    actorRole: "moderator",
    action: "Editou localização",
    target: "Warehouse 21",
    description: "Coordenada atualizada para corrigir exibição no mapa.",
    date: "Ontem, 18:10",
    severity: "info",
  },
];

const filterOptions: Array<{ value: FilterRole; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "admin", label: "ADMs" },
  { value: "moderator", label: "Moderadores" },
  { value: "user", label: "Usuários" },
];

export default function Usuarios() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<FilterRole>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    email: "",
    role: "moderator" as Exclude<AccountRole, "user">,
  });

  const metrics = useMemo(() => {
    const total = users.length;
    const admins = users.filter((user) => user.role === "admin").length;
    const moderators = users.filter((user) => user.role === "moderator").length;
    const blocked = users.filter((user) => user.status === "blocked").length;

    return { total, admins, moderators, blocked };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [query, roleFilter, users]);

  function goBack() {
    setLocation("/admin");
  }

  function openCreateAccount(role: Exclude<AccountRole, "user">) {
    setNewAccount({ name: "", email: "", role });
    setIsCreateOpen(true);
  }

  function closeCreateAccount() {
    setIsCreateOpen(false);
    setNewAccount({ name: "", email: "", role: "moderator" });
  }

  function handleCreateAccount() {
    const name = newAccount.name.trim();
    const email = newAccount.email.trim();

    if (!name || !email) return;

    const account: UserAccount = {
      id: Date.now(),
      name,
      email,
      role: newAccount.role,
      status: "active",
      createdAt: "Agora",
      lastSeen: "Nunca acessou",
      actionsCount: 0,
    };

    setUsers((prev) => [account, ...prev]);
    closeCreateAccount();
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <div
      className="min-h-screen overflow-y-auto px-4 py-6 md:px-8"
      style={{ background: theme.colors.background }}
    >
      <div className="mx-auto max-w-7xl pb-10">
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 md:gap-5">
            <button
              type="button"
              onClick={goBack}
              aria-label="Voltar para admin"
              className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/75 transition hover:border-emerald-400 hover:text-emerald-400 hover:shadow-[0_0_22px_rgba(0,255,100,0.25)] md:h-14 md:w-14"
            >
              <ArrowLeft size={25} />
            </button>

            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-emerald-400">
                Controle administrativo
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                Usuários
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/55 md:text-lg">
                Consulte contas, acompanhe permissões de ADM e moderador, crie novos acessos e audite alterações feitas na plataforma.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openCreateAccount("admin")}
              className="flex min-h-[58px] items-center justify-center gap-3 rounded-3xl border border-emerald-400 bg-emerald-400 px-5 font-bold text-black shadow-[0_0_30px_rgba(0,255,100,0.42)] transition hover:scale-[1.01] hover:bg-emerald-300"
            >
              <Crown size={22} />
              Criar ADM
            </button>

            <button
              type="button"
              onClick={() => openCreateAccount("moderator")}
              className="flex min-h-[58px] items-center justify-center gap-3 rounded-3xl border border-emerald-400 bg-black/30 px-5 font-bold text-emerald-400 transition hover:bg-emerald-400/10 hover:shadow-[0_0_24px_rgba(0,255,100,0.22)]"
            >
              <ShieldCheck size={22} />
              Criar moderador
            </button>
          </div>
        </header>

        <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<UsersRound size={24} />}
            title="Total de usuários"
            value={String(metrics.total)}
            description="Contas cadastradas"
          />

          <MetricCard
            icon={<Crown size={24} />}
            title="Contas ADM"
            value={String(metrics.admins)}
            description="Acesso administrativo total"
          />

          <MetricCard
            icon={<ShieldCheck size={24} />}
            title="Moderadores"
            value={String(metrics.moderators)}
            description="Contas com permissão parcial"
          />

          <MetricCard
            icon={<Ban size={24} />}
            title="Bloqueadas"
            value={String(metrics.blocked)}
            description="Contas suspensas ou travadas"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel
            title="Contas da plataforma"
            description="Analise usuários comuns, moderadores e administradores."
          >
            <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 text-white/60 focus-within:border-emerald-400/70">
                <Search size={20} className="text-emerald-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
                  placeholder="Buscar por nome ou e-mail"
                />
              </label>

              <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/25 p-2">
                <div className="flex items-center gap-2 px-2 text-sm font-bold text-white/45">
                  <Filter size={17} />
                </div>

                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRoleFilter(option.value)}
                    className={[
                      "rounded-xl px-4 py-2 text-sm font-bold transition",
                      roleFilter === option.value
                        ? "bg-emerald-400 text-black"
                        : "text-white/55 hover:bg-white/5 hover:text-emerald-400",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <UserRow key={user.id} user={user} initials={getInitials(user.name)} />
              ))}

              {filteredUsers.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center">
                  <p className="text-lg font-bold text-white">Nenhum usuário encontrado</p>
                  <p className="mt-2 text-sm text-white/45">
                    Ajuste a busca ou selecione outro filtro de conta.
                  </p>
                </div>
              )}
            </div>
          </Panel>

          <div className="space-y-5">
            <Panel
              title="Criar acesso administrativo"
              description="Adicione rapidamente uma conta ADM ou moderadora."
            >
              <div className="grid gap-3">
                <CreateRoleCard
                  icon={<Crown size={24} />}
                  title="Nova conta ADM"
                  description="Permissão completa para gerenciar usuários, eventos e relatórios."
                  onClick={() => openCreateAccount("admin")}
                />

                <CreateRoleCard
                  icon={<Shield size={24} />}
                  title="Nova conta moderadora"
                  description="Permissão para revisar ações, eventos e alterações operacionais."
                  onClick={() => openCreateAccount("moderator")}
                />
              </div>
            </Panel>

            <Panel
              title="Linha do tempo"
              description="Ações e alterações feitas por ADMs e moderadores."
            >
              <div className="space-y-4">
                {timelineActions.map((action, index) => (
                  <TimelineItem
                    key={action.id}
                    action={action}
                    isLast={index === timelineActions.length - 1}
                  />
                ))}
              </div>
            </Panel>
          </div>
        </section>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[32px] border border-emerald-400/35 bg-[#050b10] p-5 shadow-[0_0_45px_rgba(0,255,100,0.2)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-emerald-400">
                  Novo acesso
                </p>
                <h2 className="text-2xl font-bold text-white">
                  Criar conta {roleLabels[newAccount.role]}
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  Preencha os dados para liberar uma nova conta administrativa.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateAccount}
                aria-label="Fechar criação de conta"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/55 transition hover:border-red-400/60 hover:text-red-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Nome" icon={<UserPlus size={20} />}>
                <input
                  value={newAccount.name}
                  onChange={(event) =>
                    setNewAccount((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="input-dark"
                  placeholder="Ex: Ana Souza"
                />
              </Field>

              <Field label="E-mail" icon={<Mail size={20} />}>
                <input
                  value={newAccount.email}
                  onChange={(event) =>
                    setNewAccount((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="input-dark"
                  placeholder="ana@email.com"
                  type="email"
                />
              </Field>

              <Field label="Tipo de conta" icon={<Lock size={20} />}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <RoleOption
                    active={newAccount.role === "admin"}
                    icon={<Crown size={22} />}
                    label="ADM"
                    description="Acesso total"
                    onClick={() =>
                      setNewAccount((prev) => ({ ...prev, role: "admin" }))
                    }
                  />

                  <RoleOption
                    active={newAccount.role === "moderator"}
                    icon={<ShieldCheck size={22} />}
                    label="Moderador"
                    description="Acesso operacional"
                    onClick={() =>
                      setNewAccount((prev) => ({ ...prev, role: "moderator" }))
                    }
                  />
                </div>
              </Field>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeCreateAccount}
                className="flex min-h-[54px] items-center justify-center rounded-2xl border border-white/10 bg-black/30 font-bold text-white/60 transition hover:border-white/25 hover:text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCreateAccount}
                className="flex min-h-[54px] items-center justify-center gap-3 rounded-2xl bg-emerald-400 font-bold text-black transition hover:bg-emerald-300"
              >
                <Plus size={20} />
                Criar conta
              </button>
            </div>
          </div>
        </div>
      )}
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
    <section className="rounded-[30px] border border-white/10 bg-[#050b10]/95 p-5 shadow-[0_0_35px_rgba(0,0,0,0.45)]">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-white/45">{description}</p>}
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3 text-base font-semibold text-white/70">
        <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(0,255,100,0.45)]">
          {icon}
        </span>
        <span>{label}</span>
      </div>

      {children}
    </div>
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

function UserRow({
  user,
  initials,
}: {
  user: UserAccount;
  initials: string;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-400/45 lg:grid-cols-[1fr_auto]">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-sm font-black text-emerald-400">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold text-white">{user.name}</h3>
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>

          <div className="mt-2 grid gap-1 text-sm text-white/45 sm:grid-cols-2 xl:grid-cols-3">
            <span className="flex min-w-0 items-center gap-1.5">
              <Mail size={15} className="shrink-0" />
              <span className="truncate">{user.email}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock size={15} />
              Criado em {user.createdAt}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={15} />
              {user.lastSeen}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:justify-end">
        <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-2 text-sm">
          <p className="font-bold text-white">{user.actionsCount}</p>
          <p className="text-xs text-white/35">ações</p>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-white/45 transition hover:border-emerald-400/70 hover:text-emerald-400"
          aria-label={`Analisar conta de ${user.name}`}
        >
          <Eye size={20} />
        </button>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: AccountRole }) {
  const isAdmin = role === "admin";
  const isModerator = role === "moderator";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
        isAdmin
          ? "border-emerald-400 bg-emerald-400/15 text-emerald-400"
          : isModerator
            ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
            : "border-white/10 bg-white/5 text-white/50",
      ].join(" ")}
    >
      {isAdmin ? <Crown size={13} /> : isModerator ? <ShieldCheck size={13} /> : <UsersRound size={13} />}
      {roleLabels[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const isActive = status === "active";
  const isBlocked = status === "blocked";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
        isActive
          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
          : isBlocked
            ? "border-red-400/50 bg-red-400/10 text-red-300"
            : "border-yellow-300/50 bg-yellow-300/10 text-yellow-200",
      ].join(" ")}
    >
      {isActive ? <CheckCircle2 size={13} /> : isBlocked ? <Ban size={13} /> : <Clock size={13} />}
      {statusLabels[status]}
    </span>
  );
}

function CreateRoleCard({
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
      className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-emerald-400/70 hover:bg-emerald-400/5"
    >
      <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/50 bg-emerald-400/10 text-emerald-400 transition group-hover:bg-emerald-400 group-hover:text-black">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-white/45">{description}</p>
      </div>

      <ChevronRight className="mt-3 text-white/30 transition group-hover:text-emerald-400" size={20} />
    </button>
  );
}

function RoleOption({
  active,
  icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex min-h-[92px] items-center gap-4 rounded-2xl border p-4 text-left transition",
        active
          ? "border-emerald-400 bg-emerald-400/12 shadow-[0_0_26px_rgba(0,255,100,0.28)]"
          : "border-white/10 bg-black/25 hover:border-emerald-400/60 hover:bg-emerald-400/5",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition",
          active
            ? "border-emerald-400 bg-emerald-400 text-black"
            : "border-white/10 bg-black/40 text-emerald-400",
        ].join(" ")}
      >
        {icon}
      </div>

      <div>
        <h3 className={active ? "text-lg font-bold text-emerald-400" : "text-lg font-bold text-white"}>
          {label}
        </h3>
        <p className="mt-1 text-sm text-white/45">{description}</p>
      </div>
    </button>
  );
}

function TimelineItem({
  action,
  isLast,
}: {
  action: AdminAction;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!isLast && <div className="absolute left-[22px] top-12 h-[calc(100%-18px)] w-px bg-emerald-400/20" />}

      <div
        className={[
          "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-black text-emerald-400",
          action.severity === "warning"
            ? "border-red-400/50 text-red-300"
            : action.severity === "success"
              ? "border-emerald-400/60 text-emerald-400"
              : "border-white/10 text-white/55",
        ].join(" ")}
      >
        {action.severity === "warning" ? <Ban size={19} /> : action.severity === "success" ? <BadgeCheck size={19} /> : <Sparkles size={19} />}
      </div>

      <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-white">{action.action}</h3>
          <span className="text-xs font-semibold text-white/35">{action.date}</span>
        </div>

        <p className="mt-1 text-sm text-white/45">
          <span className="font-semibold text-emerald-400">{action.actor}</span>{" "}
          alterou <span className="font-semibold text-white/70">{action.target}</span>
        </p>

        <p className="mt-2 text-sm leading-relaxed text-white/45">{action.description}</p>
      </div>
    </div>
  );
}