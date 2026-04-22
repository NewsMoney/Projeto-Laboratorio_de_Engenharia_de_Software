import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    let locationData = null;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          locationData = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };

          console.log({
            email,
            password,
            location: locationData,
          });
        },
        () => {
          console.log({
            email,
            password,
            location: null,
          });
        }
      );
    } else {
      console.log({
        email,
        password,
        location: null,
      });
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border/50">
        <h1 className="text-lg font-bold text-foreground">JoinMe</h1>

        <button
          onClick={() => setLocation("/")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Voltar
        </button>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Entrar
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Usuário / Email
              </label>

              <input
                type="text"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Senha
              </label>

              <input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button type="submit" className="w-full h-11 mt-2">
              Entrar
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => setLocation("/")}
            >
              Voltar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}