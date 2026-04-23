import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

import { theme } from "@/lib/theme";

import {
  MapPin,
  Home,
} from "lucide-react";

/* ================================================== */
/* NOT FOUND */
/* ================================================== */

export default function NotFound() {
  const [, setLocation] =
    useLocation();

  return (
    <div
      className="flex-1 min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          theme.colors.background,
        color:
          theme.colors.text,
      }}
    >
      <div className="text-center max-w-sm w-full">
        {/* ICON */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background:
              theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <MapPin
            size={30}
            style={{
              color:
                theme.colors.textMuted,
            }}
          />
        </div>

        {/* TITLE */}
        <h1
          className="text-5xl font-bold mb-2"
          style={{
            color:
              theme.colors.primary,
          }}
        >
          404
        </h1>

        <h2 className="text-lg font-semibold mb-2">
          Página não encontrada
        </h2>

        <p
          className="text-sm mb-6 leading-relaxed"
          style={{
            color:
              theme.colors.textMuted,
          }}
        >
          A página que você procura não existe
          ou foi removida.
        </p>

        {/* CTA */}
        <Button
          onClick={() =>
            setLocation("/")
          }
          className="h-12 px-6 rounded-xl font-semibold"
          style={{
            background:
              theme.colors.primary,
            color:
              theme.colors.background,
            boxShadow:
              theme.shadow.neon,
          }}
        >
          <Home
            size={16}
            className="mr-2"
          />
          Voltar ao mapa
        </Button>
      </div>
    </div>
  );
}