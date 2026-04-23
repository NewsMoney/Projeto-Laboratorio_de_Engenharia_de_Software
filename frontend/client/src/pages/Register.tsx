import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

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

  const inputClass =
    "w-full h-14 px-4 rounded-2xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary";

  const selectClass =
    "w-full h-14 px-4 rounded-2xl border border-border bg-background text-foreground outline-none";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Topo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            JoinMe
          </h1>

          <p className="text-sm text-muted-foreground mt-2">
            Crie sua conta
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
          <form onSubmit={handleRegister} className="space-y-5">

            {/* Email */}
            <div>
              <label className="text-sm font-semibold block mb-2">
                Número de celular ou email
              </label>

              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Número de celular ou email"
                className={inputClass}
              />

              <p className="text-xs text-muted-foreground mt-2">
                Você poderá receber notificações enviadas por nós.
              </p>
            </div>

            {/* Senha */}
            <div>
              <label className="text-sm font-semibold block mb-2">
                Senha
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Data nascimento */}
            <div>
              <label className="text-sm font-semibold block mb-2">
                Data de nascimento
              </label>

              <div className="grid grid-cols-3 gap-3">
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Dia</option>

                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>

                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Mês</option>

                  {[
                    "Jan",
                    "Fev",
                    "Mar",
                    "Abr",
                    "Mai",
                    "Jun",
                    "Jul",
                    "Ago",
                    "Set",
                    "Out",
                    "Nov",
                    "Dez",
                  ].map((item, i) => (
                    <option key={i + 1} value={i + 1}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Ano</option>

                  {Array.from({ length: 80 }, (_, i) => (
                    <option key={2026 - i} value={2026 - i}>
                      {2026 - i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nome */}
            <div>
              <label className="text-sm font-semibold block mb-2">
                Nome
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                className={inputClass}
              />
            </div>

            {/* Botão */}
            <Button
              type="submit"
              className="w-full h-12 rounded-2xl"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? "Registrando..."
                : "Registrar"}
            </Button>

            {/* Login */}
            <button
              type="button"
              onClick={() => setLocation("/login")}
              className="w-full text-sm text-primary"
            >
              Já possui conta? Entrar
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}