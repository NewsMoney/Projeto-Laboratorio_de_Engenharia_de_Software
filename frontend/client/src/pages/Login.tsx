import { useState } from "react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";

import { toast } from "sonner";

/* ================================================== */
/* LOGIN PAGE */
/* ================================================== */

export default function LoginPage() {
  const [, setLocation] =
    useLocation();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const loginMutation =
    trpc.auth.login.useMutation({
      onSuccess: () => {
        toast.success(
          "Login realizado com sucesso"
        );

        setLocation("/");
      },

      onError: (err) => {
        toast.error(
          err.message ||
            "Falha no login"
        );
      },
    });

  /* ---------------------------------- */
  /* LOGIN */
  /* ---------------------------------- */

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      !email.trim() ||
      !password.trim()
    ) {
      toast.error(
        "Preencha email e senha"
      );

      return;
    }

    const submitLogin = (
      locationData: {
        lat: number;
        lng: number;
      } | null
    ) => {
      loginMutation.mutate({
        email:
          email.trim(),
        password,
        location:
          locationData,
      });
    };

    if (
      "geolocation" in
      navigator
    ) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          submitLogin({
            lat: pos.coords
              .latitude,
            lng: pos.coords
              .longitude,
          });
        },
        () =>
          submitLogin(null)
      );
    } else {
      submitLogin(null);
    }
  }

  /* ---------------------------------- */
  /* PAGE */
  /* ---------------------------------- */

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          theme.colors.background,
        color:
          theme.colors.text,
      }}
    >
      <Header
        onBack={() =>
          setLocation("/")
        }
      />

      <main className="flex-1 flex items-center justify-center px-4">
        <div
          className="w-full max-w-md rounded-2xl border p-6"
          style={{
            background:
              theme.colors.surface,
            borderColor:
              theme.colors.border,
            boxShadow:
              theme.shadow.card,
          }}
        >
          <h2 className="text-2xl font-bold text-center mb-6">
            Entrar
          </h2>

          <form
            onSubmit={
              handleLogin
            }
            className="space-y-4"
          >
            <Field label="Usuário / Email">
              <Input
                type="text"
                value={email}
                placeholder="Digite seu email"
                autoComplete="username"
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>
                ) =>
                  setEmail(
                    e.target.value
                  )
                }
              />
            </Field>
              
            <Field label="Senha">
              <Input
                type="password"
                value={password}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>
                ) =>
                  setPassword(
                    e.target.value
                  )
                }
              />
            </Field>

            <Button
              type="submit"
              disabled={
                loginMutation.isPending
              }
              className="w-full h-12 rounded-xl font-semibold mt-2"
              style={{
                background:
                  loginMutation.isPending
                    ? theme
                        .colors
                        .border
                    : theme
                        .colors
                        .primary,

                color:
                  loginMutation.isPending
                    ? theme
                        .colors
                        .textMuted
                    : theme
                        .colors
                        .background,

                boxShadow:
                  loginMutation.isPending
                    ? "none"
                    : theme
                        .shadow
                        .neon,
              }}
            >
              {loginMutation.isPending
                ? "Entrando..."
                : "Entrar"}
            </Button>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() =>
                  setLocation(
                    "/"
                  )
                }
              >
                Voltar
              </Button>

              <button
                type="button"
                onClick={() =>
                  setLocation(
                    "/register"
                  )
                }
                className="text-sm font-medium"
                style={{
                  color:
                    theme.colors.primary,
                }}
              >
                Registrar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ================================================== */
/* HEADER */
/* ================================================== */

function Header({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <header
      className="px-4 py-3 border-b flex items-center justify-between"
      style={{
        background:
          theme.colors.surface,
        borderColor:
          theme.colors.border,
      }}
    >
      <h1 className="text-lg font-bold">
        Join
        <span
          style={{
            color:
              theme.colors.primary,
          }}
        >
          Me
        </span>
      </h1>

      <button
        onClick={onBack}
        className="text-sm transition"
        style={{
          color:
            theme.colors.textMuted,
        }}
      >
        Voltar
      </button>
    </header>
  );
}

/* ================================================== */
/* FIELD */
/* ================================================== */

function Field({
  label,
  children,
}: any) {
  return (
    <div>
      <label className="text-sm font-medium block mb-2">
        {label}
      </label>

      {children}
    </div>
  );
}

/* ================================================== */
/* INPUT */
/* ================================================== */

function Input({
  ...props
}: any) {
  return (
    <input
      {...props}
      className="w-full h-12 px-4 rounded-xl border outline-none"
      style={{
        background:
          theme.colors.surfaceSoft,
        borderColor:
          theme.colors.border,
        color:
          theme.colors.text,
      }}
    />
  );
}