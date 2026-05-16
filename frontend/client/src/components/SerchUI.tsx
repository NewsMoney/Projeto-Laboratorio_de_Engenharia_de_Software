import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

import {
  Search,
  SlidersHorizontal,
  Calendar,
  Music4,
  Radio,
  X,
  Sparkles,
} from "lucide-react";

/**
 * @function SearchBar
 * @description Barra de busca principal com suporte a limpeza de texto e filtros.
 *              Possui efeito de desfoque (backdrop-blur) e sombra para destaque visual.
 * @param {string} value - O valor atual da busca.
 * @param {function} onChange - Função chamada ao alterar o texto da busca.
 * @param {function} onClear - Função chamada ao limpar o campo de busca.
 */
export function SearchBar({ value, onChange, onClear }: any) {
  return (
    <div 
      className="h-14 rounded-full px-5 flex items-center gap-4 mb-4 border backdrop-blur-md shadow-2xl" 
      style={{ background: "rgba(11, 11, 11, 0.85)", borderColor: theme.colors.border }}
    >
      {/* Ícone de Lupa */}
      <Search size={20} style={{ color: theme.colors.textMuted }} />
      
      {/* Campo de Entrada de Texto */}
      <input 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder="Buscar festas, DJs, locais..." 
        className="flex-1 bg-transparent outline-none text-base text-white placeholder:text-zinc-500" 
      />
      
      {/* Botão Condicional: Limpar (X) ou Abrir Filtros (Sliders) */}
      {value ? (
        <button onClick={onClear} className="p-1">
          <X size={18} style={{ color: theme.colors.textMuted }} />
        </button>
      ) : (
        <button 
          className="w-9 h-9 rounded-full border flex items-center justify-center active:scale-90" 
          style={{ borderColor: theme.colors.border }}
        >
          <SlidersHorizontal size={16} style={{ color: theme.colors.primary }} />
        </button>
      )}
    </div>
  );
}

/**
 * @constant FILTERS
 * @description Lista de categorias de filtros disponíveis na interface.
 */
const FILTERS = [
  { label: "Todos", icon: Sparkles },
  { label: "Festas", icon: Music4 },
  { label: "Bares", icon: Radio },
  { label: "Shows", icon: Calendar },
];

/**
 * @function FilterTabs
 * @description Abas de filtragem horizontal com rolagem lateral.
 *              Destaca visualmente a categoria selecionada com cores e sombras neon.
 * @param {string} activeFilter - O filtro que está atualmente ativo.
 * @param {function} onSelect - Função chamada ao selecionar uma nova categoria.
 */
export function FilterTabs({ activeFilter, onSelect }: any) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      {FILTERS.map((item) => (
        <button
          key={item.label}
          onClick={() => onSelect(item.label)}
          className={cn(
            "h-10 px-5 rounded-full border flex items-center gap-2 whitespace-nowrap text-xs font-bold transition-all"
          )}
          style={{
            borderColor: activeFilter === item.label ? theme.colors.primary : theme.colors.border,
            color: activeFilter === item.label ? "black" : theme.colors.textSoft,
            background: activeFilter === item.label ? theme.colors.primary : theme.colors.surface,
            boxShadow: activeFilter === item.label ? "0 0 15px rgba(0,255,102,0.2)" : "none"
          }}
        >
          <item.icon size={14} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

/**
 * @function NearbyButton
 * @description Botão flutuante posicionado na parte inferior para visualização de locais próximos.
 *              Utiliza um estilo neon e fundo semi-transparente com desfoque.
 * @param {number} count - Quantidade de locais encontrados nas proximidades.
 */
export function NearbyButton({ count }: { count: number }) {
  return (
    <div className="absolute bottom-24 lg:bottom-8 left-1/2 lg:left-auto lg:right-8 -translate-x-1/2 lg:translate-x-0 z-[1000] w-full lg:w-auto px-10 lg:px-0">
      <button
        className="w-full lg:px-10 h-14 rounded-full border-2 text-sm font-bold uppercase tracking-widest transition-all active:scale-95"
        style={{
          borderColor: theme.colors.primary,
          color: theme.colors.primary,
          background: "rgba(0,0,0,0.8)",
          boxShadow: theme.shadow.neon,
          backdropFilter: "blur(8px)"
        }}
      >
        {count > 0 ? `Ver ${count} locais próximos` : "Buscando locais..."}
      </button>
    </div>
  );
}