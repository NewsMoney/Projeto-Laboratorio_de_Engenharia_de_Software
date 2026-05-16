import {
  MapPin,
  Search,
  CheckCircle,
  Trophy,
  User,
  Shield,
  Users,
  FileText,
  Settings,
} from "lucide-react";

import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/* ================================================== */
/* DEFINIÇÕES DE NAVEGAÇÃO */
/* ================================================== */

/**
 * @interface NavItem
 * @description Define a estrutura de um item de navegação.
 * @property {string} href - O caminho (URL) para onde o item de navegação aponta.
 * @property {React.ElementType} icon - O componente de ícone a ser exibido para o item (ex: de `lucide-react`).
 * @property {string} label - O texto visível do item de navegação.
 */
interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

/**
 * @constant defaultNavItems
 * @description Array de itens de navegação padrão para usuários comuns.
 */
const defaultNavItems: NavItem[] = [
  { href: "/checkin", icon: CheckCircle, label: "Check-in" },
  { href: "/search", icon: Search, label: "Buscar" },
  { href: "/", icon: MapPin, label: "Mapa" },
  { href: "/ranking", icon: Trophy, label: "Ranking" },
  { href: "/profile", icon: User, label: "Perfil" },
];

/**
 * @constant adminNavItems
 * @description Array de itens de navegação específicos para usuários com perfil de administrador.
 */
const adminNavItems: NavItem[] = [
  { href: "/admin", icon: Shield, label: "Admin" },
  { href: "/users", icon: Users, label: "Usuários" },
  { href: "/", icon: MapPin, label: "Mapa" },
  { href: "/reports", icon: FileText, label: "Relatórios" },
  { href: "/settings", icon: Settings, label: "Config" },
];

/**
 * @constant logo
 * @description Caminho para o ícone do logo da aplicação.
 */

/* ================================================== */
/* COMPONENTE BOTTOM NAV (MOBILE) */
/* ================================================== */

/**
 * @function BottomNav
 * @description Componente de navegação inferior (Bottom Navigation) para dispositivos móveis.
 *              Exibe um conjunto de ícones de navegação que mudam com base no perfil do usuário (admin ou padrão).
 *              Destaca o item de navegação ativo.
 */
export function BottomNav() {
  // Obtém a localização atual da rota usando o hook `useLocation` do wouter.
  const [location] = useLocation();

  // Obtém o objeto de usuário e suas propriedades (como 'role') usando o hook `useAuth`.
  const { user } = useAuth();

  // Determina se o usuário atual é um administrador.
  const isAdmin = user?.role === "admin";

  // Seleciona o conjunto de itens de navegação com base no perfil do usuário.
  const navItems = isAdmin
    ? adminNavItems
    : defaultNavItems;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50", // Posicionamento fixo na parte inferior.
        "bg-[#050505]/95 backdrop-blur-xl", // Fundo escuro com desfoque para efeito moderno.
        "border-t border-[#27272a]", // Borda superior sutil.
        "lg:hidden safe-area-bottom" // Visível apenas em telas pequenas, respeita a área segura.
      )}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto"> {/* Contêiner interno para os itens de navegação */}
        {navItems.map(({ href, icon: Icon, label }) => {
          // Verifica se o item de navegação atual está ativo.
          const isActive =
            href === "/"
              ? location === "/"
              : location.startsWith(href);

          return (
            <Link
              key={href} // Chave única para cada item na lista.
              href={href} // Define o destino do link.
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-2 py-1.5 transition-all duration-300 min-w-[64px]", // Estilos base do link.
                isActive
                  ? "text-[#00FF66]" // Cor do texto para item ativo.
                  : "text-[#71717a] hover:text-[#FFFFFF]" // Cor do texto para item inativo e hover.
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center p-1 rounded-lg transition-all duration-300", // Estilos do contêiner do ícone.
                  isActive &&
                    "bg-[#00FF66]/10 shadow-[0_0_18px_rgba(0,255,102,0.22)]" // Fundo e sombra para ícone ativo.
                )}
              >
                <Icon
                  size={22} // Tamanho do ícone.
                  strokeWidth={isActive ? 2.5 : 1.5} // Espessura do traço do ícone, maior quando ativo.
                  className={cn(
                    "transition-transform duration-300", // Transição para o ícone.
                    isActive && "scale-110" // Aumenta o ícone quando ativo.
                  )}
                />
              </div>

              <span
                className={cn(
                  "text-[10px] leading-tight tracking-wide uppercase", // Estilos base do texto do label.
                  isActive
                    ? "font-bold opacity-100" // Estilos para label ativo.
                    : "font-medium opacity-70" // Estilos para label inativo.
                )}
              >
                {label}
              </span>

              {isActive && ( // Renderiza um indicador visual se o item estiver ativo.
                <div className="absolute -bottom-[1px] w-10 h-[2px] bg-[#00FF66] rounded-full shadow-[0_0_10px_#00FF66]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
