import { Button } from "@/components/ui/button";
import { MapPin, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin size={32} className="text-muted-foreground" />
        </div>
        <h1 className="text-5xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Página não encontrada
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          A página que você procura não existe ou foi removida.
        </p>
        <Button onClick={() => setLocation("/")}>
          <Home size={16} className="mr-2" />
          Voltar ao mapa
        </Button>
      </div>
    </div>
  );
}
