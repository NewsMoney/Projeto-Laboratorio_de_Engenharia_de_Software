/**
 * @file LoadingState.tsx
 * @description Componente de estado de carregamento reutilizável.
 * Exibe um spinner centralizado com a cor primária do tema.
 * Utilizado em páginas como Ranking, Search, Details, Profile e ReportsPage.
 */

import { Loader2 } from "lucide-react";
import { theme } from "@/lib/theme";

interface LoadingStateProps {
  /** Tamanho do ícone de carregamento em pixels. Padrão: 24 */
  size?: number;
  /** Classes CSS adicionais para o container */
  className?: string;
}

/**
 * @component LoadingState
 * @description Exibe um spinner animado centralizado para indicar carregamento de dados.
 * O spinner usa a cor primária do tema para manter consistência visual.
 *
 * @example
 * // Uso básico
 * {isLoading && <LoadingState />}
 *
 * // Com tamanho personalizado
 * {isLoading && <LoadingState size={32} />}
 */
export function LoadingState({ size = 24, className = "" }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <Loader2
        size={size}
        className="animate-spin"
        style={{ color: theme.colors.primary }}
        aria-label="Carregando..."
      />
    </div>
  );
}
