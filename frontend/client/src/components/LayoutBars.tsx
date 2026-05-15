import {
  MapPin,
  Search,
  CheckCircle,
  Trophy,
  User,
  LogOut,
  Shield,
  Users,
  FileText,
  Settings,
} from "lucide-react";

import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { theme } from "@/lib/theme";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

/* ================================================== */
/* NAV ITEMS */
/* ================================================== */

const defaultNavItems = [
  { href: "/checkin", icon: CheckCircle, label: "Check-in" },
  { href: "/search", icon: Search, label: "Buscar" },
  { href: "/", icon: MapPin, label: "Mapa" },
  { href: "/ranking", icon: Trophy, label: "Ranking" },
  { href: "/profile", icon: User, label: "Perfil" },
];

const adminNavItems = [
  { href: "/admin", icon: Shield, label: "Admin" },
  { href: "/users", icon: Users, label: "Usuários" },
  { href: "/", icon: MapPin, label: "Mapa" },
  { href: "/reports", icon: FileText, label: "Relatórios" },
  { href: "/settings", icon: Settings, label: "Config" },
];

const logo = "src/components/ui/logo-icon.png";

/* ================================================== */
/* HELPERS */
/* ================================================== */

function isRouteActive(
  location: string,
  href: string
) {
  if (href === "/") {
    return location === "/";
  }

  return (
    location === href ||
    location.startsWith(`${href}/`)
  );
}

/* ================================================== */
/* BOTTOM NAV (MOBILE) */
/* ================================================== */

export function BottomNav() {
  const [location] = useLocation();

  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const navItems = isAdmin
    ? adminNavItems
    : defaultNavItems;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-[#050505]/95 backdrop-blur-xl",
        "border-t border-[#27272a]",
        "lg:hidden safe-area-bottom"
      )}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/"
              ? location === "/"
              : location.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-2 py-1.5 transition-all duration-300 min-w-[64px]",
                isActive
                  ? "text-[#00FF66]"
                  : "text-[#71717a] hover:text-[#FFFFFF]"
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center p-1 rounded-lg transition-all duration-300",
                  isActive &&
                    "bg-[#00FF66]/10 shadow-[0_0_18px_rgba(0,255,102,0.22)]"
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={cn(
                    "transition-transform duration-300",
                    isActive && "scale-110"
                  )}
                />
              </div>

              <span
                className={cn(
                  "text-[10px] leading-tight tracking-wide uppercase",
                  isActive
                    ? "font-bold opacity-100"
                    : "font-medium opacity-70"
                )}
              >
                {label}
              </span>

              {isActive && (
                <div className="absolute -bottom-[1px] w-10 h-[2px] bg-[#00FF66] rounded-full shadow-[0_0_10px_#00FF66]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ================================================== */
/* DESKTOP SIDEBAR */
/* ================================================== */

export function DesktopSidebar() {
  const [location] = useLocation();

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  return (
    <aside
      className="
        hidden lg:flex flex-col
        w-72 h-screen sticky top-0
        border-r z-[1001]
      "
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <SidebarLogo />

      <SidebarNav location={location} />

      <SidebarUser
        user={user}
        isAuthenticated={isAuthenticated}
        logout={logout}
      />
    </aside>
  );
}

/* ================================================== */
/* SIDEBAR LOGO */
/* ================================================== */

export function SidebarLogo() {
  return (
    <div
      className="px-8 py-10 border-b"
      style={{
        borderColor: theme.colors.borderSoft,
      }}
    >
      <Link href="/" className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-[#00FF66]/20 blur-lg rounded-full" />

          <img
            src={ logo }
            alt="Logo"
            className="
              w-16 h-16 object-contain
              relative z-10
              drop-shadow-[0_0_8px_#00FF66]
            "
          />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tighter">
          <span className="text-white">Join</span>

          <span style={{ color: theme.colors.primary }}>
            Me
          </span>
        </h1>
      </Link>
    </div>
  );
}

/* ================================================== */
/* SIDEBAR NAV */
/* ================================================== */

function SidebarNav({
  location,
}: {
  location: string;
}) {
  const { user } = useAuth();

  const isAdmin =
    user?.role?.toLowerCase() === "admin";

  const navItems = isAdmin
    ? adminNavItems
    : defaultNavItems;

  return (
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navItems.map(
        ({ href, icon: Icon, label }) => {
          const isActive = isRouteActive(
            location,
            href
          );

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group",
                isActive
                  ? "shadow-lg"
                  : "hover:bg-white/5"
              )}
              style={{
                backgroundColor: isActive
                  ? `${theme.colors.primary}10`
                  : "transparent",

                color: isActive
                  ? theme.colors.primary
                  : theme.colors.textSoft,

                border: isActive
                  ? `1px solid ${theme.colors.primary}30`
                  : "1px solid transparent",
              }}
            >
              <Icon
                size={20}
                strokeWidth={
                  isActive ? 2.5 : 2
                }
                className={cn(
                  "transition-transform group-hover:scale-110"
                )}
              />

              {label}
            </Link>
          );
        }
      )}
    </nav>
  );
}

/* ================================================== */
/* SIDEBAR USER */
/* ================================================== */

function SidebarUser({
  user,
  isAuthenticated,
  logout,
}: any) {
  return (
    <div
      className="px-4 py-6 border-t"
      style={{
        borderColor: theme.colors.borderSoft,
      }}
    >
      {isAuthenticated && user ? (
        <div className="flex items-center gap-3 px-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center border"
            style={{
              backgroundColor:
                theme.colors.surfaceSoft,
              borderColor:
                theme.colors.border,
            }}
          >
            <User
              size={20}
              style={{
                color: theme.colors.primary,
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-white">
              {user.username ??
                user.name ??
                "Usuário"}
            </p>

            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              {user?.role
                ?.toLowerCase() === "admin"
                ? "Administrador"
                : "Membro Premium"}
            </p>
          </div>

          <button
            onClick={() => logout()}
            className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        <Button
          className="w-full h-12 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95"
          style={{
            backgroundColor:
              theme.colors.primary,
            color: "black",
            boxShadow: theme.shadow.neon,
          }}
          onClick={() =>
            (window.location.href =
              getLoginUrl())
          }
        >
          Entrar
        </Button>
      )}
    </div>
  );
}