/**
 * @file NotFound.tsx
 * @description Página 404 - Não Encontrado.
 * Exibida quando o usuário tenta acessar uma rota que não existe.
 * Apresenta uma mensagem amigável e um botão para retornar ao mapa.
 */

import { useLocation } from "wouter";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { MapPin, Home } from "lucide-react";

/**
 * @component NotFound
 * @description Página de erro 404 com ícone, título e botão de retorno.
 * Usa as cores do tema centralizado para manter consistência visual.
 */
export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="flex-1 min-h-screen flex items-center justify-center px-4"
      style={{ background: theme.colors.background, color: theme.colors.text }}
    >
      <div className="text-center max-w-sm w-full">
        {/* Ícone de localização indicando página não encontrada */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <MapPin size={30} style={{ color: theme.colors.textMuted }} />
        </div>

        {/* Código de erro em destaque */}
        <h1 className="text-5xl font-bold mb-2" style={{ color: theme.colors.primary }}>
          404
        </h1>

        {/* Título e descrição do erro */}
        <h2 className="text-lg font-semibold mb-2">Página não encontrada</h2>
        <p
          className="text-sm mb-6 leading-relaxed"
          style={{ color: theme.colors.textMuted }}
        >
          A página que você procura não existe ou foi removida.
        </p>

        {/* Botão de retorno ao mapa */}
        <Button
          onClick={() => setLocation("/")}
          className="h-12 px-6 rounded-xl font-semibold"
          style={{
            background: theme.colors.primary,
            color: theme.colors.background,
            boxShadow: theme.shadow.neon,
          }}
        >
          <Home size={16} className="mr-2" />
          Voltar ao mapa
        </Button>
      </div>
    </div>
  );
}
