/**
 * @file Login.tsx
 * @description Página de login do usuário.
 * Aceita autenticação com email OU username — o campo detecta automaticamente
 * o que foi digitado: se contiver "@" é tratado como email, caso contrário como username.
 * Redireciona para a página inicial após login bem-sucedido.
 * Oferece link para a página de registro de novos usuários.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, MapPin } from "lucide-react";
import { toast } from "sonner";

/* ================================================== */
/* PÁGINA PRINCIPAL */
/* ================================================== */

/**
 * @component Login
 * @description Formulário de login com campo único de identificação (email ou username) e senha.
 * O campo "Email ou usuário" detecta automaticamente o tipo de entrada:
 * - Se contiver "@", envia como `email` para o backend
 * - Caso contrário, envia como `username`
 * Exibe/oculta a senha com botão de alternância.
 * Redireciona para "/" após autenticação bem-sucedida.
 */
export default function Login() {
  const [, setLocation] = useLocation();

  /* Estado dos campos do formulário */
  const [identifier, setIdentifier] = useState(""); // email ou username
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* Mutation de login via tRPC */
  const loginMutation = trpc.auth.login.useMutation();
  const utils = trpc.useUtils();

  /**
   * @function handleSubmit
   * @description Processa o envio do formulário de login.
   * Detecta se o identificador é email (contém "@") ou username e envia
   * o campo correto para o backend. O backend exige exatamente um dos dois.
   * Em caso de sucesso, invalida o cache de autenticação e redireciona.
   * Em caso de erro, exibe uma notificação toast.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    /* Determina se o usuário digitou email ou username */
    const isEmail = identifier.includes("@");

    try {
      await loginMutation.mutateAsync(
        isEmail
          ? { email: identifier, password }
          : { username: identifier, password }
      );
      await utils.auth.me.invalidate();
      setLocation("/");
    } catch {
      toast.error("Credenciais inválidas. Verifique seu email/usuário e senha.");
    }
  }

  const loading = loginMutation.isPending;

  return (
    <div
      className="flex-1 min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: theme.colors.background, color: theme.colors.text }}
    >
      <div className="w-full max-w-sm">
        {/* Logo e título da aplicação */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <MapPin size={28} style={{ color: theme.colors.primary }} />
          </div>
          <h1 className="text-2xl font-bold">Entrar</h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
            Acesse sua conta para continuar
          </p>
        </div>

        {/* Formulário de login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo único: aceita email ou username */}
          <div>
            <label className="text-sm font-semibold block mb-2">
              Email ou usuário
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="seu@email.com ou seu_usuario"
              required
              autoComplete="username"
              className={inputClass()}
              style={{
                background: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
          </div>

          {/* Campo de senha com botão de visibilidade */}
          <div>
            <label className="text-sm font-semibold block mb-2">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={inputClass("pr-12")}
                style={{
                  background: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              />
              {/* Botão para alternar visibilidade da senha */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff size={18} style={{ color: theme.colors.textMuted }} />
                ) : (
                  <Eye size={18} style={{ color: theme.colors.textMuted }} />
                )}
              </button>
            </div>
          </div>

          {/* Botão de submissão */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl font-semibold"
            style={{
              background: loading ? theme.colors.border : theme.colors.primary,
              color: loading ? theme.colors.textMuted : theme.colors.background,
              boxShadow: loading ? "none" : theme.shadow.neon,
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        {/* Link para registro de nova conta */}
        <button
          type="button"
          onClick={() => setLocation("/register")}
          className="w-full text-sm mt-4"
          style={{ color: theme.colors.primary }}
        >
          Não possui conta? Registrar-se
        </button>
      </div>
    </div>
  );
}

/* ================================================== */
/* UTILITÁRIOS DE ESTILO */
/* ================================================== */

/**
 * @function inputClass
 * @description Retorna a classe CSS padrão para campos de input.
 * Centraliza o estilo dos inputs para manter consistência visual.
 *
 * @param extra - Classes CSS adicionais (ex: "pr-12" para padding direito)
 */
function inputClass(extra = "") {
  return `w-full h-14 px-4 rounded-2xl border outline-none transition-colors ${extra}`;
}
