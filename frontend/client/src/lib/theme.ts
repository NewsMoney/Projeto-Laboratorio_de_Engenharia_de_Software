/**
 * @file theme.ts
 * @description Camada de compatibilidade de tema e centralização de estilos.
 * Centraliza cores, sombras, bordas e classes CSS comuns para evitar repetição
 * de código nas páginas e componentes.
 */

const cssVar = (name: string) => `var(--${name})`;

export const theme = {
  colors: {
    /* Layout */
    background: cssVar("background"),
    foreground: cssVar("foreground"),
    
    /* Surfaces */
    card: cssVar("card"),
    cardForeground: cssVar("card-foreground"),
    popover: cssVar("popover"),
    popoverForeground: cssVar("popover-foreground"),
    
    /* Brand */
    primary: cssVar("primary"),
    primaryHover: cssVar("primary-hover"),
    primaryForeground: cssVar("primary-foreground"),
    
    /* Secondary */
    secondary: cssVar("secondary"),
    secondaryForeground: cssVar("secondary-foreground"),
    
    /* Muted */
    muted: cssVar("muted"),
    mutedForeground: cssVar("muted-foreground"),
    
    /* Accent */
    accent: cssVar("accent"),
    accentForeground: cssVar("accent-foreground"),
    
    /* Status */
    destructive: cssVar("destructive"),
    destructiveForeground: cssVar("destructive-foreground"),
    success: cssVar("primary"),
    warning: "#facc15",
    danger: cssVar("destructive"),
    
    /* Forms */
    border: cssVar("border"),
    input: cssVar("input"),
    ring: cssVar("ring"),
    
    /* Sidebar */
    sidebar: cssVar("sidebar"),
    sidebarForeground: cssVar("sidebar-foreground"),
    sidebarPrimary: cssVar("sidebar-primary"),
    sidebarPrimaryForeground: cssVar("sidebar-primary-foreground"),
    sidebarAccent: cssVar("sidebar-accent"),
    sidebarAccentForeground: cssVar("sidebar-accent-foreground"),
    sidebarBorder: cssVar("sidebar-border"),
    sidebarRing: cssVar("sidebar-ring"),
    
    /* Extra */
    surface: cssVar("card"),
    surfaceSoft: cssVar("secondary"),
    text: cssVar("foreground"),
    textMuted: cssVar("muted-foreground"),
    textSoft: cssVar("muted-foreground"),
    borderSoft: cssVar("border"),
    mapOverlay: "rgba(0,0,0,0.35)",
  },
  radius: {
    sm: cssVar("radius-sm"),
    md: cssVar("radius-md"),
    lg: cssVar("radius-lg"),
    xl: cssVar("radius-xl"),
    pill: "999px",
  },
  shadow: {
    neon: "0 0 18px rgba(0,255,102,0.22)",
    neonStrong: "0 0 28px rgba(0,255,102,0.35)",
    card: "0 10px 30px rgba(0,0,0,0.45)",
  },
  /* Classes CSS comuns para reutilização */
  styles: {
    input: "w-full h-14 px-4 rounded-2xl border outline-none transition-colors",
    select: "w-full h-14 px-4 rounded-2xl border outline-none transition-colors",
    buttonPrimary: "w-full h-14 rounded-2xl font-semibold transition-all duration-200",
    buttonOutline: "w-full h-14 rounded-2xl font-semibold border transition-all duration-200",
    pageContainer: "flex-1 min-h-screen flex flex-col bg-background text-foreground",
    pageCenter: "flex-1 min-h-screen flex flex-col items-center justify-center px-4",
    card: "rounded-xl border p-4 transition-colors",
  }
} as const;

export type Theme = typeof theme;
