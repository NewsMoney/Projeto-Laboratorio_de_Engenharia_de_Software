/**
 * @file EmptyState.tsx
 * @description Componente de estado vazio reutilizável.
 * Exibe um ícone centralizado com mensagem e subtítulo opcionais.
 * Utilizado em páginas como Ranking, Search, Details e ReportsPage.
 */

import { MapPin } from "lucide-react";
import { theme } from "@/lib/theme";
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Mensagem principal exibida abaixo do ícone */
  message?: string;
  /** Subtítulo ou instrução adicional */
  subMessage?: string;
  /** Ícone personalizado. Padrão: MapPin */
  icon?: ReactNode;
  /** Classes CSS adicionais para o container */
  className?: string;
}

/**
 * @component EmptyState
 * @description Exibe um estado vazio com ícone, mensagem e subtítulo opcionais.
 * Usado quando uma lista ou resultado de busca não possui itens para exibir.
 *
 * @example
 * // Uso básico
 * <EmptyState message="Nenhum local encontrado" />
 *
 * // Com subtítulo
 * <EmptyState
 *   message="Nenhum resultado"
 *   subMessage="Tente buscar com outros termos"
 * />
 *
 * // Com ícone personalizado
 * <EmptyState icon={<Star size={30} />} message="Sem avaliações ainda" />
 */
export function EmptyState({
  message = "Nenhum item encontrado",
  subMessage,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      {/* Ícone centralizado com fundo do tema */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        {icon ?? (
          <MapPin size={30} style={{ color: theme.colors.textMuted }} />
        )}
      </div>

      {/* Mensagem principal */}
      <p
        className="text-sm font-medium text-center"
        style={{ color: theme.colors.textMuted }}
      >
        {message}
      </p>

      {/* Subtítulo opcional */}
      {subMessage && (
        <p
          className="text-xs mt-1 text-center"
          style={{ color: theme.colors.textMuted, opacity: 0.7 }}
        >
          {subMessage}
        </p>
      )}
    </div>
  );
}
