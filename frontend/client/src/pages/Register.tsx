import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Register() {
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Conta criada com sucesso");
      setLocation("/login");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao registrar");
    },
  });

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    registerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
    });
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border/50">
        <h1 className="text-lg font-bold text-foreground">JoinMe</h1>

        <button
          onClick={() => setLocation("/login")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Voltar
        </button>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Criar Conta
          </h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">
                Nome
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full h-11 px-4 rounded-xl border border-border bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu email"
                className="w-full h-11 px-4 rounded-xl border border-border bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Senha
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full h-11 px-4 rounded-xl border border-border bg-background"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}