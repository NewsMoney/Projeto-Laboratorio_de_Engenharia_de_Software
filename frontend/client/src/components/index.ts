/**
 * @file index.ts
 * @description Ponto de exportação central de todos os componentes reutilizáveis.
 * Permite importar qualquer componente a partir de "@/components" sem precisar
 * especificar o caminho completo de cada arquivo.
 *
 * @example
 * // Importação centralizada
 * import { PageHeader, LoadingState, EmptyState } from "@/components";
 *
 * // Ao invés de importações individuais:
 * // import { PageHeader } from "@/components/PageHeader";
 * // import { LoadingState } from "@/components/LoadingState";
 */

/* Componentes de layout e estrutura de página */
export { PageHeader } from "./PageHeader";
export { PageCard } from "./PageCard";
export { PageCenter } from "./PageCenter";

/* Componentes de estado */
export { LoadingState } from "./LoadingState";
export { EmptyState } from "./EmptyState";

/* Componentes de UI específicos */
export { StarRating } from "./StarRating";
export { CategoryBadge } from "./CategoryBadge";
export { StatCard } from "./StatCard";

/* Componentes de layout principal */
export { AppLayout } from "./AppLayout";
export { default as ErrorBoundary } from "./ErrorBoundary";
export { default as LeafletMap } from "./LeafletMap";
export { default as LoginDialog } from "./LoginDialog";

/* Componentes de interface Desktop e Mobile */
export { DesktopSidebar } from "./DesktopUI";
export { BottomNav, MobileHeader } from "./MobileUI";

/* Componentes de busca */
export { SearchBar, FilterTabs, NearbyButton } from "./SerchUI";
