/**
 * @file PageHeader.tsx
 * @description Componente de cabeçalho de página reutilizável.
 * Exibe um botão de voltar e um título, com estilos do tema centralizado.
 * Utilizado em páginas como Details, CheckIn, Search, Ranking e MapPage.
 */

import { ArrowLeft } from "lucide-react";
import { theme } from "@/lib/theme";

interface PageHeaderProps {
  /** Título exibido no cabeçalho */
  title: string;
  /** Função chamada ao clicar no botão de voltar */
  onBack: () => void;
  /** Classes CSS adicionais para o elemento header */
  className?: string;
}

/**
 * @component PageHeader
 * @description Cabeçalho padrão de página com botão de voltar e título.
 * Visível apenas em telas menores que lg (1024px), pois o desktop
 * utiliza a sidebar de navegação.
 *
 * @example
 * <PageHeader title="Detalhes do Local" onBack={() => setLocation("/")} />
 */
export function PageHeader({ title, onBack, className = "" }: PageHeaderProps) {
  return (
    <header
      className={`px-4 py-3 flex items-center gap-3 border-b lg:hidden ${className}`}
      style={{
        background: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      {/* Botão de voltar */}
      <button
        onClick={onBack}
        aria-label="Voltar"
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: theme.colors.surfaceSoft }}
      >
        <ArrowLeft size={18} />
      </button>

      {/* Título da página */}
      <h1 className="text-base font-bold truncate">{title}</h1>
    </header>
  );
}
