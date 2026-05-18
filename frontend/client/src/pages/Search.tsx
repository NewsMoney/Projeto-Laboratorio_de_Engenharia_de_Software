/**
 * @file Search.tsx
 * @description Página de busca de locais.
 * Permite ao usuário pesquisar locais por nome com debounce para otimizar
 * as requisições ao servidor. Exibe resultados em lista com nome, endereço e categoria.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";
import { Input } from "@/components/ui/input";
import { MapPin, Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { CategoryBadge } from "@/components/CategoryBadge";
import { useComposition } from "@/hooks/useComposition";

/* ================================================== */
/* PÁGINA PRINCIPAL */
/* ================================================== */

/**
 * @component Search
 * @description Página de busca com campo de texto e lista de resultados.
 * Usa debounce para evitar requisições excessivas durante a digitação.
 */
export default function Search() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");

  /* Hook de composição para suporte a IME (idiomas asiáticos) */
  const { isComposing, onCompositionStart, onCompositionEnd } = useComposition();

  /* Debounce da query: aguarda 300ms após o usuário parar de digitar */
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const handleSearch = (value: string) => {
    setQuery(value);
    if (!isComposing) {
      clearTimeout((handleSearch as any)._timer);
      (handleSearch as any)._timer = setTimeout(() => setDebouncedQuery(value), 300);
    }
  };

  /*
   * Busca os locais pelo nome via tRPC.
   * A query só é disparada quando há ao menos 1 caractere digitado,
   * pois o backend exige query.min(1) e retorna erro 400 com string vazia.
   */
  const hasQuery = debouncedQuery.length > 0;
  const { data: places, isLoading } = trpc.places.search.useQuery(
    { query: debouncedQuery },
    { enabled: hasQuery }
  );

  return (
    <div
      className="flex-1 min-h-screen flex flex-col"
      style={{ background: theme.colors.background, color: theme.colors.text }}
    >
      {/* Cabeçalho com campo de busca */}
      <header
        className="px-4 py-3 border-b"
        style={{ background: theme.colors.surface, borderColor: theme.colors.border }}
      >
        {/* Botão de voltar e título — usa PageHeader centralizado */}
        <PageHeader title="Buscar" onBack={() => setLocation("/")} />

        {/* Campo de busca com ícone */}
        <div className="relative mt-2">
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: theme.colors.textMuted }}
          />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            placeholder="Buscar por nome do local..."
            autoFocus
            className="pl-10 h-11 border rounded-xl"
            style={{
              background: theme.colors.surfaceSoft,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
          />
        </div>
      </header>

      {/* Conteúdo: estados de carregamento, vazio ou lista de resultados */}
      <div className="flex-1 overflow-y-auto">
        {/* Estado de carregamento — usa LoadingState centralizado */}
        {isLoading && <LoadingState />}

        {/* Estado inicial: nenhuma busca realizada ainda */}
        {!hasQuery && (
          <EmptyState
            message="Digite para buscar"
            subMessage="Pesquise por nome do local, festa ou evento"
          />
        )}

        {/* Estado vazio: busca realizada mas sem resultados */}
        {hasQuery && !isLoading && places && places.length === 0 && (
          <EmptyState
            message="Nenhum local encontrado"
            subMessage="Tente buscar com outros termos"
          />
        )}

        {/* Lista de resultados */}
        {places && places.length > 0 && (
          <div className="divide-y" style={{ borderColor: theme.colors.border }}>
            {places.map((place) => (
              <PlaceRow
                key={place.id}
                place={place}
                onOpen={() => setLocation(`/details/${place.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================== */
/* COMPONENTES INTERNOS */
/* ================================================== */

/**
 * @component PlaceRow
 * @description Item de resultado de busca.
 * Exibe nome, endereço e categoria do local em formato de linha clicável.
 *
 * @param place - Dados do local
 * @param onOpen - Função chamada ao clicar para ver detalhes
 */
function PlaceRow({ place, onOpen }: any) {
  return (
    <button
      onClick={onOpen}
      className="w-full px-4 py-3.5 flex items-start gap-3 text-left transition"
      style={{ background: theme.colors.background }}
    >
      {/* Ícone do local */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: theme.colors.surfaceSoft }}
      >
        <MapPin size={18} style={{ color: theme.colors.primary }} />
      </div>

      {/* Informações do local */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{place.name}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: theme.colors.textMuted }}>
          {place.address}
        </p>

        {/* Badge de categoria — usa CategoryBadge centralizado */}
        {place.category && place.category !== "general" && (
          <CategoryBadge className="mt-1.5">{place.category}</CategoryBadge>
        )}
      </div>
    </button>
  );
}
