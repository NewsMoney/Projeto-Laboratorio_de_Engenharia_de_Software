import { MapPin, Search, CheckCircle, Trophy, User, LogOut } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", icon: MapPin, label: "Mapa" },
  { href: "/search", icon: Search, label: "Buscar" },
  { href: "/checkin", icon: CheckCircle, label: "Check-in" },
  { href: "/ranking", icon: Trophy, label: "Ranking" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export function DesktopSidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(20,184,166,0.3)]">
            <MapPin size={20} className="text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">JoinMe</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary shadow-[0_0_8px_rgba(20,184,166,0.15)]"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center ring-1 ring-primary/20">
              <User size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name ?? "Usuário"}
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="text-sidebar-foreground/40 hover:text-destructive transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
          >
            Entrar
          </Button>
        )}
      </div>
    </aside>
  );
}
