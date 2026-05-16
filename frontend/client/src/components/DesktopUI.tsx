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
/* DEFINIÇÕES DE NAVEGAÇÃO */
/* ================================================== */

/**
 * @interface NavItem
 * @description Define a estrutura de um item de navegação para a barra lateral.
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
const logo = "src/components/ui/logo-icon.png";

/* ================================================== */
/* FUNÇÕES AUXILIARES */
/* ================================================== */

/**
 * @function isRouteActive
 * @description Verifica se uma rota está ativa com base na localização atual e no href do item de navegação.
 * @param {string} location - A localização (URL) atual do navegador.
 * @param {string} href - O caminho (URL) do item de navegação a ser verificado.
 */
function isRouteActive(
  location: string,
  href: string
) {
  // Caso especial para a rota raiz ("/").
  if (href === "/") {
    return location === "/";
  }

  // Verifica se a localização atual corresponde exatamente ao href ou começa com ele (para rotas aninhadas).
  return (
    location === href ||
    location.startsWith(`${href}/`)
  );
}

/* ================================================== */
/* COMPONENTE DESKTOP SIDEBAR */
/* ================================================== */

/**
 * @function DesktopSidebar
 * @description Componente de barra lateral para visualização em desktop.
 *              Contém o logo, os itens de navegação (dinâmicos para admin/usuário) e as informações do usuário/botão de login.
 */
export function DesktopSidebar() {
  // Obtém a localização atual da rota usando o hook `useLocation` do wouter.
  const [location] = useLocation();

  // Obtém informações de autenticação e funções do hook `useAuth`.
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
      " // Estilos para posicionamento e visibilidade em desktop.
      style={{
        backgroundColor: theme.colors.surface, // Cor de fundo da barra lateral.
        borderColor: theme.colors.border, // Cor da borda direita.
      }}
    >
      {/* Componente do logo da barra lateral */}
      <SidebarLogo />

      {/* Componente de navegação da barra lateral, passando a localização atual */}
      <SidebarNav location={location} />

      {/* Componente de informações do usuário e logout/login */}
      <SidebarUser
        user={user}
        isAuthenticated={isAuthenticated}
        logout={logout}
      />
    </aside>
  );
}

/* ================================================== */
/* COMPONENTE SIDEBAR LOGO */
/* ================================================== */

/**
 * @function SidebarLogo
 * @description Componente que exibe o logo da aplicação na barra lateral.
 *              Inclui um efeito visual de brilho e o nome da aplicação estilizado.
 */
export function SidebarLogo() {
  return (
    <div
      className="px-8 py-10 border-b" // Preenchimento e borda inferior.
      style={{
        borderColor: theme.colors.borderSoft, // Cor da borda inferior.
      }}
    >
      <Link href="/" className="flex items-center gap-3"> {/* Link para a página inicial */}
        <div className="relative"> {/* Contêiner para o logo com efeito de brilho */}
          <div className="absolute inset-0 bg-[#00FF66]/20 blur-lg rounded-full" /> {/* Efeito de brilho */}

          <img
            src={ logo }
            alt="Logo"
            className="
              w-16 h-16 object-contain
              relative z-10
              drop-shadow-[0_0_8px_#00FF66]
            " // Estilos da imagem do logo.
          />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tighter"> {/* Título da aplicação */}
          <span className="text-white"> {/* Parte "Jo" do nome */}
            Jo
            <span className="relative inline-block"> {/* Estilização especial para o "i" */}
              ı 
              <span
                className="absolute left-[56%] -translate-x-1/2 rounded-full"
                style={{
                  width: "0.19em",
                  height: "0.2em",
                  backgroundColor: theme.colors.primary,
                  top: "0.15em",
                }}
              />
            </span>
            n
          </span>
              
          <span style={{ color: theme.colors.primary }}> {/* Parte "Me" do nome com cor primária */}
            Me
          </span>
        </h1>
      </Link>
    </div>
  );
}

/* ================================================== */
/* COMPONENTE SIDEBAR NAV */
/* ================================================== */

/**
 * @interface SidebarNavProps
 * @description Propriedades aceitas pelo componente SidebarNav.
 * @property {string} location - A localização (URL) atual do navegador, usada para destacar o item ativo.
 */
interface SidebarNavProps {
  location: string;
}

/**
 * @function SidebarNav
 * @description Componente que renderiza os itens de navegação da barra lateral.
 *              Os itens são dinâmicos, exibindo opções diferentes para usuários comuns e administradores.
 *              Destaca visualmente o item de navegação que corresponde à rota atual.
 * @param {SidebarNavProps} { location } - As propriedades do componente, incluindo a localização atual.
 */
function SidebarNav({
  location,
}: SidebarNavProps) {
  // Obtém o objeto de usuário do hook `useAuth`.
  const { user } = useAuth();

  // Verifica se o usuário atual tem a função de administrador.
  const isAdmin =
    user?.role?.toLowerCase() === "admin";

  // Seleciona o array de itens de navegação apropriado (admin ou padrão).
  const navItems = isAdmin
    ? adminNavItems
    : defaultNavItems;

  return (
    <nav className="flex-1 px-4 py-6 space-y-2"> {/* Contêiner da navegação, ocupando o espaço restante */}
      {navItems.map(
        ({ href, icon: Icon, label }) => {
          // Determina se o item de navegação atual está ativo.
          const isActive = isRouteActive(
            location,
            href
          );

          return (
            <Link
              key={href} // Chave única para cada item na lista.
              href={href} // Define o destino do link.
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group", // Estilos base do link.
                isActive
                  ? "shadow-lg" // Sombra para o item ativo.
                  : "hover:bg-white/5" // Efeito de hover para itens inativos.
              )}
              style={{
                backgroundColor: isActive
                  ? `${theme.colors.primary}10` // Cor de fundo para item ativo.
                  : "transparent", // Fundo transparente para item inativo.

                color: isActive
                  ? theme.colors.primary // Cor do texto para item ativo.
                  : theme.colors.textSoft, // Cor do texto para item inativo.

                border: isActive
                  ? `1px solid ${theme.colors.primary}30` // Borda para item ativo.
                  : "1px solid transparent", // Borda transparente para item inativo.
              }}
            >
              <Icon
                size={20} // Tamanho do ícone.
                strokeWidth={
                  isActive ? 2.5 : 2 // Espessura do traço do ícone, maior quando ativo.
                }
                className={cn(
                  "transition-transform group-hover:scale-110" // Efeito de escala no hover.
                )}
              />

              {label} {/* Texto do label do item de navegação */}
            </Link>
          );
        }
      )}
    </nav>
  );
}

/* ================================================== */
/* COMPONENTE SIDEBAR USER */
/* ================================================== */

/**
 * @interface SidebarUserProps
 * @description Propriedades aceitas pelo componente SidebarUser.
 * @property {any} user - O objeto de usuário autenticado, ou `null` se não houver usuário.
 * @property {boolean} isAuthenticated - Indica se o usuário está autenticado.
 * @property {() => void} logout - Função para realizar o logout do usuário.
 */
interface SidebarUserProps {
  user: any | null;
  isAuthenticated: boolean;
  logout: () => void;
}

/**
 * @function SidebarUser
 * @description Componente que exibe as informações do usuário logado ou um botão de login na barra lateral.
 *              Apresenta o nome e o papel do usuário, além de um botão de logout.
 *              Se o usuário não estiver autenticado, exibe um botão para iniciar o processo de login.
 * @param {SidebarUserProps} { user, isAuthenticated, logout } - As propriedades do componente.
 */
function SidebarUser({
  user,
  isAuthenticated,
  logout,
}: SidebarUserProps) {
  return (
    <div
      className="px-4 py-6 border-t" // Preenchimento e borda superior.
      style={{
        borderColor: theme.colors.borderSoft, // Cor da borda superior.
      }}
    >
      {isAuthenticated && user ? ( // Renderiza as informações do usuário se estiver autenticado.
        <div className="flex items-center gap-3 px-2"> {/* Contêiner para o avatar, nome e botão de logout */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center border" // Estilos do avatar do usuário.
            style={{
              backgroundColor:
                theme.colors.surfaceSoft, // Cor de fundo do avatar.
              borderColor:
                theme.colors.border, // Cor da borda do avatar.
            }}
          >
            <User
              size={20}
              style={{
                color: theme.colors.primary, // Cor do ícone de usuário.
              }}
            />
          </div>

          <div className="flex-1 min-w-0"> {/* Contêiner para o nome e papel do usuário */}
            <p className="text-sm font-bold truncate text-white"> {/* Nome do usuário */}
              {user.username ??
                user.name ??
                "Usuário"} {/* Exibe username, nome ou um fallback */}
            </p>

            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider"> {/* Papel do usuário */}
              {user?.role
                ?.toLowerCase() === "admin"
                ? "Administrador"
                : "Membro Premium"} {/* Exibe o papel do usuário (Admin ou Membro Premium) */}
            </p>
          </div>

          <button
            onClick={() => logout()} // Chama a função de logout ao clicar.
            className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors" // Estilos do botão de logout.
          >
            <LogOut size={18} /> {/* Ícone de logout */}
          </button>
        </div>
      ) : ( // Renderiza o botão de login se o usuário não estiver autenticado.
        <Button
          className="w-full h-12 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95" // Estilos do botão de login.
          style={{
            backgroundColor:
              theme.colors.primary, // Cor de fundo do botão de login.
            color: "black", // Cor do texto do botão de login.
            boxShadow: theme.shadow.neon, // Sombra com efeito neon.
          }}
          onClick={() =>
            (window.location.href =
              getLoginUrl()) // Redireciona para a URL de login ao clicar.
          }
        >
          Entrar
        </Button>
      )}
    </div>
  );
}
