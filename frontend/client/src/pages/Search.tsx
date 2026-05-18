/**
 * @file Search.tsx
 * @description Página de busca de locais com sugestões em tempo real.
 *
 * Comportamento:
 * - Campo vazio: exibe todos os locais como sugestão (trpc.places.list)
 * - Digitando: filtra a lista local instantaneamente enquanto o usuário digita,
 *   e também dispara uma busca no servidor com debounce de 300ms (trpc.places.search)
 *   para garantir resultados mais precisos do banco de dados.
 * - Os resultados do servidor substituem o filtro local assim que chegam.
 *
 * Endpoints utilizados:
 * - trpc.places.list   → lista geral de locais (sugestão inicial e filtro local)
 * - trpc.places.search → busca por nome no servidor (requer query.min(1))
 */

import { useState, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";
import { Input } from "@/components/ui/input";
import { MapPin, Search as SearchIcon, ArrowLeft, Loader2 } from "lucide-react";

/* ================================================== */
/* PÁGINA PRINCIPAL */
/* ================================================== */

/**
 * @component Search
 * @description Página de busca com sugestões em tempo real.
 *
 * Estratégia de busca em duas camadas:
 * 1. Filtro local imediato: filtra a lista já carregada enquanto o usuário digita
 * 2. Busca no servidor com debounce: garante resultados mais completos do banco
 *
 * Isso dá a sensação de resposta instantânea sem sobrecarregar o servidor.
 */
export default function Search() {
  const [, setLocation] = useLocation();

  /* Valor atual do campo de busca (atualizado a cada tecla) */
  const [query, setQuery] = useState("");

  /* Query com debounce: enviada ao servidor após 300ms sem digitação */
  const [debouncedQuery, setDebouncedQuery] = useState("");

  /* Ref para o timer do debounce — evita criar closures a cada render */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * Lista completa de locais: carregada uma vez e usada para filtro local imediato.
   * Limite de 100 para cobrir bem as sugestões sem sobrecarregar.
   */
  const { data: allPlaces, isLoading: listLoading } = trpc.places.list.useQuery({
    limit: 100,
    offset: 0,
  });

  /*
   * Busca no servidor: só ativa quando há texto digitado (min 1 char).
   * O backend rejeita query vazia com erro 400.
   * Retorna resultados mais precisos via LIKE no banco de dados.
   */
  const { data: serverResults, isFetching: serverFetching } = trpc.places.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 }
  );

  /*
   * Filtro local imediato: filtra a lista já carregada pelo texto atual.
   * Aplicado enquanto o servidor ainda não respondeu, dando feedback instantâneo.
   * Usa `query` (não debouncedQuery) para responder a cada tecla.
   */
  const localFiltered = useMemo(() => {
    if (!allPlaces) return [];
    if (!query.trim()) return allPlaces;
    const lower = query.toLowerCase();
    return allPlaces.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.address && p.address.toLowerCase().includes(lower)) ||
        (p.category && p.category.toLowerCase().includes(lower))
    );
  }, [allPlaces, query]);

  /*
   * Seleção da lista final exibida:
   * - Se o servidor já respondeu com resultados para a query atual → usa resultados do servidor
   * - Caso contrário → usa o filtro local (resposta imediata)
   * - Campo vazio → exibe todos os locais como sugestão
   */
  const places = useMemo(() => {
    if (!query.trim()) return allPlaces ?? [];
    /* Prefere resultados do servidor quando disponíveis para a query atual */
    if (serverResults && debouncedQuery === query.trim()) return serverResults;
    /* Fallback: filtro local enquanto aguarda o servidor */
    return localFiltered;
  }, [query, debouncedQuery, serverResults, localFiltered, allPlaces]);

  /* Indicador de carregamento: spinner apenas quando não há nenhum resultado ainda */
  const isLoading = listLoading && !allPlaces;

  /* Indica que o servidor ainda está buscando (para feedback visual sutil) */
  const isSearching = query.trim().length > 0 && serverFetching;

  /**
   * @function handleSearch
   * @description Atualiza a query imediatamente (para filtro local instantâneo)
   * e aplica debounce de 300ms antes de disparar a busca no servidor.
   */
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 300);
  }, []);

  return (
    <div
      className="flex-1 flex flex-col min-h-screen"
      style={{ background: theme.colors.background, color: theme.colors.text }}
    >
      {/* Cabeçalho com botão de voltar e campo de busca */}
      <header
        className="px-4 py-3 border-b"
        style={{ background: theme.colors.surface, borderColor: theme.colors.border }}
      >
        {/* Botão de voltar e título — visível apenas em mobile */}
        <div className="flex items-center gap-3 mb-3 lg:hidden">
          <button
            onClick={() => setLocation("/")}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: theme.colors.surfaceSoft }}
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold">Buscar Locais</h1>
        </div>

        {/* Campo de busca com ícone e indicador de carregamento */}
        <div className="relative">
          <SearchIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: theme.colors.textMuted }}
          />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nome, endereço ou categoria..."
            autoFocus
            className="pl-10 pr-10 h-11 border rounded-xl"
            style={{
              background: theme.colors.surfaceSoft,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
          />
          {/* Spinner sutil no canto direito enquanto o servidor busca */}
          {isSearching && (
            <Loader2
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin"
              style={{ color: theme.colors.textMuted }}
            />
          )}
        </div>
      </header>

      {/* Conteúdo: carregamento inicial, vazio ou lista */}
      <div className="flex-1 overflow-y-auto">

        {/* Carregamento inicial da lista (apenas na primeira carga) */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: theme.colors.primary }}
            />
          </div>
        )}

        {/* Estado vazio: busca realizada mas sem resultados */}
        {!isLoading && places.length === 0 && query.trim().length > 0 && (
          <EmptyState />
        )}

        {/* Lista de resultados ou sugestões */}
        {!isLoading && places.length > 0 && (
          <div className="divide-y" style={{ borderColor: theme.colors.border }}>
            {/* Label de contexto */}
            <p
              className="px-4 py-2 text-xs font-medium"
              style={{ color: theme.colors.textMuted }}
            >
              {query.trim().length > 0
                ? `${places.length} resultado${places.length !== 1 ? "s" : ""}`
                : "Todos os locais"}
            </p>

            {places.map((place) => (
              <PlaceRow
                key={place.id}
                place={place}
                highlight={query.trim()}
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
 * @component EmptyState
 * @description Estado vazio exibido quando a busca não retorna resultados.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <MapPin size={30} style={{ color: theme.colors.textMuted }} />
      </div>
      <p className="text-sm font-medium" style={{ color: theme.colors.textMuted }}>
        Nenhum local encontrado
      </p>
      <p
        className="text-xs mt-1"
        style={{ color: theme.colors.textMuted, opacity: 0.7 }}
      >
        Tente buscar com outros termos
      </p>
    </div>
  );
}

/**
 * @component PlaceRow
 * @description Item de resultado de busca ou sugestão.
 * Exibe nome, endereço e categoria do local em formato de linha clicável.
 * Destaca o trecho do nome que corresponde ao texto buscado.
 *
 * @param place     - Dados do local
 * @param highlight - Texto a destacar no nome do local
 * @param onOpen    - Função chamada ao clicar para ver detalhes
 */
function PlaceRow({ place, highlight, onOpen }: { place: any; highlight: string; onOpen: () => void }) {
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
        {/* Nome com destaque do trecho buscado */}
        <p className="text-sm font-semibold truncate">
          <HighlightText text={place.name} highlight={highlight} />
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: theme.colors.textMuted }}>
          {place.address}
        </p>

        {/* Badge de categoria — oculto para categoria genérica */}
        {place.category && place.category !== "general" && (
          <span
            className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
              background: theme.colors.surfaceSoft,
              color: theme.colors.textSoft,
            }}
          >
            {place.category}
          </span>
        )}
      </div>
    </button>
  );
}

/**
 * @component HighlightText
 * @description Renderiza um texto destacando o trecho que corresponde à busca.
 * Divide o texto em partes e aplica fundo colorido na parte que coincide.
 *
 * @param text      - Texto completo a exibir
 * @param highlight - Trecho a destacar (case insensitive)
 */
function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              background: theme.colors.primary + "33", /* 20% de opacidade */
              color: "inherit",
              borderRadius: "2px",
              padding: "0 1px",
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
