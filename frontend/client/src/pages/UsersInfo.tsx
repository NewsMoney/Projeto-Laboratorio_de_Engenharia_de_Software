import { useMemo, useState } from "react";

import { useLocation } from "wouter";

import {
  ArrowLeft,
  Ban,
  CalendarClock,
  Clock,
  Crown,
  Eye,
  Filter,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

import { theme } from "@/lib/theme";

import { trpc } from "@/lib/trpc";

type AccountRole =
  | "admin"
  | "moderator"
  | "user";

type FilterRole =
  | "all"
  | AccountRole;

const roleLabels = {
  admin: "ADM",
  moderator: "Moderador",
  user: "Usuário",
};

export default function Usuarios() {
  const [, setLocation] =
    useLocation();

  /**
   * FILTERS
   */
  const [query, setQuery] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState<FilterRole>("all");

  const [showFilters, setShowFilters] =
    useState(false);

  const [sortBy, setSortBy] =
    useState("recent");

  /**
   * CREATE MODAL
   */
  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [newUser, setNewUser] =
    useState({
      name: "",
      username: "",
      email: "",
      password: "",

      role: "admin" as
        | "admin"
        | "moderator",
    });

  const utils = trpc.useUtils();

  /**
   * USERS QUERY
   */
  const {
    data: usersData = [],
    isLoading,
  } =
    trpc.users.getAll.useQuery();

  /**
   * REGISTER
   */
  const registerUser =
    trpc.auth.register.useMutation();

  /**
   * UPDATE ROLE
   */
  const updateRole =
    trpc.users.updateRole.useMutation({
      onSuccess:
        async () => {
          await utils.users.getAll.invalidate();
        },
    });

  /**
   * CREATE ADMIN
   */
  async function handleCreateAdmin() {
    if (
      !newUser.name ||
      !newUser.username ||
      !newUser.email ||
      !newUser.password
    ) {
      return;
    }

    try {
      const created =
        await registerUser.mutateAsync({
          name: newUser.name,

          username:
            newUser.username,

          email:
            newUser.email,

          password:
            newUser.password,

          birthDate:
            "2000-01-01",
        });

      await updateRole.mutateAsync({
        userId: created.id,

        role: newUser.role,
      });

      await utils.users.getAll.invalidate();

      setNewUser({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "admin",
      });

      setIsCreateOpen(false);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * FORMAT USERS
   */
  const users = useMemo(() => {
    return usersData.map((user) => ({
      id: user.id,

      name: user.name,

      email: user.email,

      username:
        user.username,

      role:
        user.role as AccountRole,

      createdAt: new Date(
        user.createdAt
      ).toLocaleDateString(
        "pt-BR"
      ),

      lastSeen: user.updatedAt
        ? new Date(
            user.updatedAt
          ).toLocaleDateString(
            "pt-BR"
          )
        : "Nunca",

      actionsCount:
        user.actionsCount ?? 0,
    }));
  }, [usersData]);

  /**
   * METRICS
   */
  const metrics = useMemo(() => {
    return {
      total: users.length,

      admins: users.filter(
        (u) => u.role === "admin"
      ).length,

      moderators: users.filter(
        (u) =>
          u.role ===
          "moderator"
      ).length,

      users: users.filter(
        (u) => u.role === "user"
      ).length,
    };
  }, [users]);

  /**
   * FILTER USERS
   */
  const filteredUsers =
    useMemo(() => {
      const search = query
        .trim()
        .toLowerCase();

      let filtered =
        users.filter((user) => {
          const matchesSearch =
            !search ||
            user.name
              .toLowerCase()
              .includes(search) ||
            user.email
              .toLowerCase()
              .includes(search);

          const matchesRole =
            roleFilter ===
              "all" ||
            user.role ===
              roleFilter;

          return (
            matchesSearch &&
            matchesRole
          );
        });

      switch (sortBy) {
        case "name":
          filtered.sort((a, b) =>
            a.name.localeCompare(
              b.name
            )
          );
          break;

        case "checkins":
          filtered.sort(
            (a, b) =>
              b.actionsCount -
              a.actionsCount
          );
          break;

        case "oldest":
          filtered.reverse();
          break;

        default:
          break;
      }

      return filtered;
    }, [
      users,
      query,
      roleFilter,
      sortBy,
    ]);

  /**
   * LOADING
   */
  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-white"
        style={{
          background:
            theme.colors.background,
        }}
      >
        Carregando usuários...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6 text-white"
      style={{
        background:
          theme.colors.background,
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                setLocation("/admin")
              }
              className="rounded-xl border border-white/10 p-3 transition hover:border-emerald-400/40"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-4xl font-bold">
                Usuários
              </h1>

              <p className="text-white/50">
                Gerenciamento de usuários da plataforma
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setIsCreateOpen(true)
            }
            className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-6 py-3 font-bold text-emerald-400 transition hover:bg-emerald-400/20"
          >
            <Plus size={18} />
            Criar ADM
          </button>
        </div>

        {/* METRICS */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Usuários"
            value={metrics.total}
            icon={<UsersRound />}
          />

          <MetricCard
            title="Administradores"
            value={metrics.admins}
            icon={<Crown />}
          />

          <MetricCard
            title="Moderadores"
            value={
              metrics.moderators
            }
            icon={<ShieldCheck />}
          />

          <MetricCard
            title="Usuários comuns"
            value={metrics.users}
            icon={<UsersRound />}
          />
        </div>

        {/* SEARCH + FILTER */}
        <div className="mb-5">
          <div className="flex gap-4">
            {/* SEARCH */}
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4">
              <Search size={18} />

              <input
                value={query}
                onChange={(e) =>
                  setQuery(
                    e.target.value
                  )
                }
                placeholder="Buscar usuário"
                className="h-14 w-full bg-transparent outline-none"
              />
            </div>

            {/* ROLE FILTER */}
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(
                  e.target
                    .value as FilterRole
                )
              }
              className="rounded-2xl border border-white/10 bg-black/30 px-5 outline-none"
            >
              <option value="all">
                Todos
              </option>

              <option value="admin">
                ADMs
              </option>

              <option value="moderator">
                Moderadores
              </option>

              <option value="user">
                Usuários
              </option>
            </select>

            {/* FILTER BUTTON */}
            <button
              onClick={() =>
                setShowFilters(
                  !showFilters
                )
              }
              className={[
                "rounded-2xl border px-5 transition",

                showFilters
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                  : "border-white/10",
              ].join(" ")}
            >
              <Filter size={18} />
            </button>
          </div>

          {/* ADVANCED FILTERS */}
          {showFilters && (
            <div className="mt-4 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 md:grid-cols-3">
              {/* ROLE */}
              <div>
                <label className="mb-2 block text-sm text-white/50">
                  Tipo de conta
                </label>

                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(
                      e.target
                        .value as FilterRole
                    )
                  }
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 outline-none"
                >
                  <option value="all">
                    Todos
                  </option>

                  <option value="admin">
                    ADMs
                  </option>

                  <option value="moderator">
                    Moderadores
                  </option>

                  <option value="user">
                    Usuários
                  </option>
                </select>
              </div>

              {/* SORT */}
              <div>
                <label className="mb-2 block text-sm text-white/50">
                  Ordenação
                </label>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 outline-none"
                >
                  <option value="recent">
                    Mais recentes
                  </option>

                  <option value="oldest">
                    Mais antigos
                  </option>

                  <option value="name">
                    Nome A-Z
                  </option>

                  <option value="checkins">
                    Mais check-ins
                  </option>
                </select>
              </div>

              {/* CLEAR */}
              <div>
                <label className="mb-2 block text-sm text-white/50">
                  Ações
                </label>

                <button
                  onClick={() => {
                    setQuery("");
                    setRoleFilter(
                      "all"
                    );
                    setSortBy(
                      "recent"
                    );
                  }}
                  className="h-12 w-full rounded-xl border border-red-400/30 bg-red-400/10 font-bold text-red-300 transition hover:bg-red-400/20"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* USERS */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-5"
            >
              <div className="flex items-center justify-between gap-5">
                {/* INFO */}
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">
                      {user.name}
                    </h2>

                    <RoleBadge
                      role={user.role}
                    />
                  </div>

                  <div className="space-y-1 text-sm text-white/50">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />

                      {user.email}
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarClock size={14} />

                      Criado em{" "}
                      {
                        user.createdAt
                      }
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={14} />

                      Última atividade:{" "}
                      {
                        user.lastSeen
                      }
                    </div>

                    <div className="flex items-center gap-2">
                      <Eye size={14} />

                      {
                        user.actionsCount
                      }{" "}
                      check-ins
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() =>
                      updateRole.mutate({
                        userId:
                          user.id,

                        role:
                          "admin",
                      })
                    }
                    disabled={
                      updateRole.isPending
                    }
                    className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-400/20"
                  >
                    Tornar ADM
                  </button>

                  <button
                    onClick={() =>
                      updateRole.mutate({
                        userId:
                          user.id,

                        role:
                          "moderator",
                      })
                    }
                    disabled={
                      updateRole.isPending
                    }
                    className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/20"
                  >
                    Tornar Moderador
                  </button>

                  <button
                    onClick={() =>
                      updateRole.mutate({
                        userId:
                          user.id,

                        role:
                          "user",
                      })
                    }
                    disabled={
                      updateRole.isPending
                    }
                    className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-400/20"
                  >
                    Remover Permissões
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* EMPTY */}
          {filteredUsers.length ===
            0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center">
              <Ban
                size={42}
                className="mx-auto mb-4 text-white/20"
              />

              <h2 className="text-xl font-bold">
                Nenhum usuário encontrado
              </h2>

              <p className="mt-2 text-white/50">
                Tente ajustar sua
                pesquisa.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#050b10] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Criar conta administrativa
              </h2>

              <button
                onClick={() =>
                  setIsCreateOpen(false)
                }
                className="rounded-xl border border-white/10 p-2"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                placeholder="Nome"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    name:
                      e.target.value,
                  })
                }
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none"
              />

              <input
                placeholder="Username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    username:
                      e.target.value,
                  })
                }
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none"
              />

              <input
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    email:
                      e.target.value,
                  })
                }
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none"
              />

              <input
                type="password"
                placeholder="Senha"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    password:
                      e.target.value,
                  })
                }
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none"
              />

              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,

                    role:
                      e.target
                        .value as
                        | "admin"
                        | "moderator",
                  })
                }
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none"
              >
                <option value="admin">
                  ADM
                </option>

                <option value="moderator">
                  Moderador
                </option>
              </select>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() =>
                  setIsCreateOpen(false)
                }
                className="h-14 flex-1 rounded-2xl border border-white/10"
              >
                Cancelar
              </button>

              <button
                onClick={
                  handleCreateAdmin
                }
                disabled={
                  registerUser.isPending ||
                  updateRole.isPending
                }
                className="h-14 flex-1 rounded-2xl bg-emerald-400 font-bold text-black"
              >
                Criar conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="mb-4 text-emerald-400">
        {icon}
      </div>

      <div className="text-sm text-white/50">
        {title}
      </div>

      <div className="mt-2 text-4xl font-black">
        {value}
      </div>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: AccountRole;
}) {
  return (
    <div
      className={[
        "rounded-full px-3 py-1 text-xs font-bold",

        role === "admin"
          ? "bg-emerald-400/10 text-emerald-400"
          : role ===
              "moderator"
            ? "bg-cyan-400/10 text-cyan-300"
            : "bg-white/10 text-white/70",
      ].join(" ")}
    >
      {roleLabels[role]}
    </div>
  );
}