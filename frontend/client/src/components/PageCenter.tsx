/**
 * @file PageCenter.tsx
 * @description Componente de centralização de conteúdo de página.
 * Envolve o conteúdo em um container que ocupa a tela inteira e centraliza
 * o conteúdo vertical e horizontalmente.
 * Utilizado em CheckIn para estados de carregamento e erro.
 */

import type { ReactNode } from "react";

interface PageCenterProps {
  /** Conteúdo a ser centralizado */
  children: ReactNode;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * @component PageCenter
 * @description Container que centraliza conteúdo vertical e horizontalmente
 * em uma página de altura mínima de 100vh.
 *
 * @example
 * <PageCenter>
 *   <LoadingState />
 * </PageCenter>
 *
 * <PageCenter>
 *   <EmptyState message="Você precisa estar logado" />
 * </PageCenter>
 */
export function PageCenter({ children, className = "" }: PageCenterProps) {
  return (
    <div className={`flex-1 min-h-screen flex flex-col items-center justify-center px-4 ${className}`}>
      {children}
    </div>
  );
}
