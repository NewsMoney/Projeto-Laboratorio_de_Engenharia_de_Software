import { MapPin, Search, CheckCircle, Trophy, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

// Nota: Assumindo que o Tailwind está configurado para ler os tokens do seu theme.ts
// Caso contrário, você pode usar inline styles ou CSS variables.

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
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-[#050505]/95 backdrop-blur-xl", // theme.colors.surface
        "border-t border-[#27272a]",        // theme.colors.border
        "lg:hidden safe-area-bottom"
      )}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/" ? location === "/" : location.startsWith(href);
          
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-2 py-1.5 transition-all duration-300 min-w-[64px]",
                isActive
                  ? "text-[#00FF66]" // theme.colors.primary
                  : "text-[#71717a] hover:text-[#FFFFFF]" // textMuted -> text
              )}
            >
              {/* Efeito de Glow no ícone ativo */}
              <div className={cn(
                "relative flex items-center justify-center p-1 rounded-lg transition-all duration-300",
                isActive && "bg-[#00FF66]/10 shadow-[0_0_18px_rgba(0,255,102,0.22)]" // primaryGlow + shadow.neon
              )}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 1.5} 
                  className={cn(
                    "transition-transform duration-300",
                    isActive && "scale-110"
                  )}
                />
              </div>

              <span className={cn(
                "text-[10px] leading-tight tracking-wide uppercase",
                isActive ? "font-bold opacity-100" : "font-medium opacity-70"
              )}>
                {label}
              </span>

              {/* Indicador visual inferior com brilho forte */}
              {isActive && (
                <div 
                  className="absolute -bottom-[1px] w-10 h-[2px] bg-[#00FF66] rounded-full shadow-[0_0_10px_#00FF66]" 
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}