/**
 * @file PageCard.tsx
 * @description Componente de card de página reutilizável com estilos do tema.
 * Substitui os múltiplos componentes "Card" locais definidos em Details, CheckIn e outras páginas.
 */

import { theme } from "@/lib/theme";
import type { ReactNode } from "react";

interface PageCardProps {
  /** Conteúdo interno do card */
  children: ReactNode;
  /** Classes CSS adicionais */
  className?: string;
  /** Padding interno. Padrão: "p-4" */
  padding?: string;
}

/**
 * @component PageCard
 * @description Container com bordas arredondadas, fundo e borda do tema centralizado.
 * Substitui os componentes Card locais duplicados em várias páginas.
 *
 * @example
 * <PageCard>
 *   <p>Conteúdo do card</p>
 * </PageCard>
 *
 * // Com padding personalizado
 * <PageCard padding="p-5">
 *   <p>Conteúdo com mais espaço</p>
 * </PageCard>
 */
export function PageCard({ children, className = "", padding = "p-4" }: PageCardProps) {
  return (
    <div
      className={`rounded-xl border ${padding} ${className}`}
      style={{
        background: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      {children}
    </div>
  );
}
