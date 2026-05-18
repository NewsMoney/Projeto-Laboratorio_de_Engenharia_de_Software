/**
 * @file CategoryBadge.tsx
 * @description Componente de badge de categoria reutilizável.
 * Exibe um rótulo de categoria com fundo e cor do tema centralizado.
 * Utilizado em Details, Search e MapPage para indicar a categoria do local.
 */

import { theme } from "@/lib/theme";
import type { ReactNode } from "react";

interface CategoryBadgeProps {
  /** Texto ou conteúdo exibido no badge */
  children: ReactNode;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * @component CategoryBadge
 * @description Badge arredondado para exibir categorias de locais.
 * Usa as cores de superfície e texto do tema para manter consistência visual.
 *
 * @example
 * <CategoryBadge>Bar</CategoryBadge>
 * <CategoryBadge>Show</CategoryBadge>
 */
export function CategoryBadge({ children, className = "" }: CategoryBadgeProps) {
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full font-medium ${className}`}
      style={{
        background: theme.colors.surfaceSoft,
        color: theme.colors.textSoft,
      }}
    >
      {children}
    </span>
  );
}
