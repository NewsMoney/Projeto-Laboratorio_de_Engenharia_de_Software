/**
 * @file StarRating.tsx
 * @description Componente de avaliação por estrelas reutilizável.
 * Suporta modo somente leitura (exibição) e modo interativo (seleção).
 * Utilizado em Details (ReviewCard) e CheckIn (ReviewStep).
 */

import { Star } from "lucide-react";

interface StarRatingProps {
  /** Nota atual (1 a 5) */
  rating: number;
  /** Função chamada ao selecionar uma nota. Se omitida, o componente fica somente leitura */
  onRate?: (rating: number) => void;
  /** Tamanho das estrelas em pixels. Padrão: 20 */
  size?: number;
  /** Classes CSS adicionais para o container */
  className?: string;
}

/**
 * @component StarRating
 * @description Exibe estrelas de avaliação. Pode ser usado em modo somente leitura
 * (para exibir avaliações existentes) ou em modo interativo (para coletar avaliações).
 *
 * @example
 * // Modo somente leitura (exibição de avaliação)
 * <StarRating rating={4} />
 *
 * // Modo interativo (seleção de nota)
 * <StarRating rating={rating} onRate={setRating} size={34} />
 */
export function StarRating({ rating, onRate, size = 20, className = "" }: StarRatingProps) {
  const isInteractive = typeof onRate === "function";

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          /* Desabilita a interação no modo somente leitura */
          disabled={!isInteractive}
          onClick={() => onRate?.(star)}
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
          className={isInteractive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={size}
            className={
              star <= rating
                ? "fill-yellow-500 text-yellow-500"
                : "text-zinc-700"
            }
          />
        </button>
      ))}
    </div>
  );
}
