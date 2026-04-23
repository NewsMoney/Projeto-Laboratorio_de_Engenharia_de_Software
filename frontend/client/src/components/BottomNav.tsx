import { MapPin, Search, CheckCircle, Trophy, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/checkin", icon: CheckCircle, label: "Check-in" },
  { href: "/search", icon: Search, label: "Buscar" },
  { href: "/", icon: MapPin, label: "Mapa" },
  { href: "/ranking", icon: Trophy, label: "Ranking" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 min-w-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative",
                isActive && "drop-shadow-[0_0_6px_rgba(20,184,166,0.4)]"
              )}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={cn(
                "text-[10px] leading-tight",
                isActive ? "font-semibold" : "font-medium"
              )}>{label}</span>
              {isActive && (
                <div className="absolute -bottom-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
