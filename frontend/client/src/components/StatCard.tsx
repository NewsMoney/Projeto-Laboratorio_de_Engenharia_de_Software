/**
 * @file StatCard.tsx
 * @description Componente de card de estatística reutilizável.
 * Exibe um ícone, valor e rótulo em um container com fundo suave do tema.
 * Utilizado em Details para exibir check-ins, avaliação média e outros dados.
 */

import { theme } from "@/lib/theme";
import type { ReactNode } from "react";

interface StatCardProps {
  /** Ícone exibido ao lado do valor */
  icon: ReactNode;
  /** Valor principal da estatística */
  value: string | number;
  /** Rótulo descritivo abaixo do valor */
  label: string;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * @component StatCard
 * @description Exibe uma estatística com ícone, valor e rótulo.
 * Usado em páginas de detalhes para apresentar métricas de forma compacta.
 *
 * @example
 * <StatCard
 *   icon={<Star size={14} className="fill-yellow-500 text-yellow-500" />}
 *   value="4.5"
 *   label="Avaliação"
 * />
 */
export function StatCard({ icon, value, label, className = "" }: StatCardProps) {
  return (
    <div
      className={`rounded-lg p-3 text-center ${className}`}
      style={{ background: theme.colors.surfaceSoft }}
    >
      {/* Ícone e valor na mesma linha */}
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-lg font-bold">{value}</span>
      </div>

      {/* Rótulo descritivo */}
      <p
        className="text-xs"
        style={{ color: theme.colors.textMuted }}
      >
        {label}
      </p>
    </div>
  );
}
