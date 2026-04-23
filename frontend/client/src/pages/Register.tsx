import { useState } from "react";
import { useLocation } from "wouter";

import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";

import { Button } from "@/components/ui/button";

import { toast } from "sonner";

import {
  Eye,
  EyeOff,
} from "lucide-react";

/* ================================================== */
/* REGISTER */
/* ================================================== */

export default function Register() {
  const [, setLocation] =
    useLocation();

  const [name, setName] =
    useState("");

  const [
    username,
    setUsername,
  ] = useState("");

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [day, setDay] =
    useState("");

  const [month, setMonth] =
    useState("");

  const [year, setYear] =
    useState("");

  const registerMutation =
    trpc.auth.register.useMutation(
      {
        onSuccess: () => {
          toast.success(
            "Conta criada com sucesso"
          );

          setLocation(
            "/login"
          );
        },

        onError: (
          err
        ) => {
          toast.error(
            err.message ||
              "Erro ao registrar"
          );
        },
      }
    );

  /* ---------------------------------- */
  /* SUBMIT */
  /* ---------------------------------- */

  function handleRegister(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const emptyFields =
      !name.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !day ||
      !month ||
      !year;

    if (emptyFields) {
      toast.error(
        "Preencha todos os campos"
      );
      return;
    }

    const birthDate =
      `${year}-${month.padStart(
        2,
        "0"
      )}-${day.padStart(
        2,
        "0"
      )}`;

    registerMutation.mutate({
      name: name.trim(),
      username:
        username.trim(),
      email:
        email.trim(),
      password,
      birthDate,
    });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background:
          theme.colors.background,
        color:
          theme.colors.text,
      }}
    >
      <div className="w-full max-w-md">
        <RegisterHeader />

        <div
          className="rounded-3xl border p-6"
          style={{
            background:
              theme.colors.surface,
            borderColor:
              theme.colors.border,
            boxShadow:
              theme.shadow.card,
          }}
        >
          <form
            onSubmit={
              handleRegister
            }
            className="space-y-5"
          >
            <NameField
              value={name}
              onChange={
                setName
              }
            />

            <UsernameField
              value={
                username
              }
              onChange={
                setUsername
              }
            />

            <EmailField
              value={email}
              onChange={
                setEmail
              }
            />

            <PasswordField
              value={
                password
              }
              onChange={
                setPassword
              }
              showPassword={
                showPassword
              }
              setShowPassword={
                setShowPassword
              }
            />

            <BirthDateFields
              day={day}
              month={
                month
              }
              year={year}
              setDay={
                setDay
              }
              setMonth={
                setMonth
              }
              setYear={
                setYear
              }
            />

            <RegisterButton
              loading={
                registerMutation.isPending
              }
            />

            <LoginLink
              onClick={() =>
                setLocation(
                  "/login"
                )
              }
            />
          </form>
        </div>
      </div>
    </div>
  );
}

/* ================================================== */
/* HEADER */
/* ================================================== */

function RegisterHeader() {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold">
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

      <p
        className="text-sm mt-2"
        style={{
          color:
            theme.colors.textMuted,
        }}
      >
        Crie sua conta
      </p>
    </div>
  );
}

/* ================================================== */
/* FIELDS */
/* ================================================== */

function NameField({
  value,
  onChange,
}: any) {
  return (
    <InputField
      label="Nome completo"
      placeholder="Nome completo"
      value={value}
      onChange={onChange}
    />
  );
}

function UsernameField({
  value,
  onChange,
}: any) {
  return (
    <InputField
      label="Nome de usuário"
      placeholder="@seunome"
      value={value}
      onChange={onChange}
    />
  );
}

function EmailField({
  value,
  onChange,
}: any) {
  return (
    <div>
      <InputField
        label="Email"
        type="email"
        placeholder="ex: exemplo@gmail.com"
        value={value}
        onChange={onChange}
      />

      <p
        className="text-xs mt-2"
        style={{
          color:
            theme.colors.textMuted,
        }}
      >
        Você poderá receber notificações enviadas por nós.
      </p>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  showPassword,
  setShowPassword,
}: any) {
  return (
    <div>
      <label className="text-sm font-semibold block mb-2">
        Senha
      </label>

      <div className="relative">
        <input
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          placeholder="Senha"
          className={inputClass(
            "pr-12"
          )}
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword(
              !showPassword
            )
          }
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          {showPassword ? (
            <EyeOff
              size={18}
              style={{
                color:
                  theme.colors.textMuted,
              }}
            />
          ) : (
            <Eye
              size={18}
              style={{
                color:
                  theme.colors.textMuted,
              }}
            />
          )}
        </button>
      </div>
    </div>
  );
}

/* ================================================== */
/* BIRTH DATE */
/* ================================================== */

function BirthDateFields({
  day,
  month,
  year,
  setDay,
  setMonth,
  setYear,
}: any) {
  const months = [
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
  ];

  return (
    <div>
      <label className="text-sm font-semibold block mb-2">
        Data de nascimento
      </label>

      <div className="grid grid-cols-3 gap-3">
        <SelectField
          value={day}
          onChange={setDay}
          placeholder="Dia"
          options={Array.from(
            { length: 31 },
            (_, i) => ({
              value:
                String(
                  i + 1
                ),
              label:
                String(
                  i + 1
                ),
            })
          )}
        />

        <SelectField
          value={month}
          onChange={
            setMonth
          }
          placeholder="Mês"
          options={months.map(
            (
              item,
              index
            ) => ({
              value:
                String(
                  index + 1
                ),
              label:
                item,
            })
          )}
        />

        <SelectField
          value={year}
          onChange={
            setYear
          }
          placeholder="Ano"
          options={Array.from(
            { length: 80 },
            (_, i) => ({
              value:
                String(
                  2026 - i
                ),
              label:
                String(
                  2026 - i
                ),
            })
          )}
        />
      </div>
    </div>
  );
}

/* ================================================== */
/* REUSABLE */
/* ================================================== */

function InputField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: any) {
  return (
    <div>
      <label className="text-sm font-semibold block mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={placeholder}
        className={inputClass()}
      />
    </div>
  );
}

function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: any) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value
        )
      }
      className={selectClass()}
    >
      <option value="">
        {placeholder}
      </option>

      {options.map(
        (item: any) => (
          <option
            key={item.value}
            value={
              item.value
            }
          >
            {item.label}
          </option>
        )
      )}
    </select>
  );
}

function RegisterButton({
  loading,
}: {
  loading: boolean;
}) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="w-full h-12 rounded-2xl font-semibold"
      style={{
        background:
          loading
            ? theme.colors.border
            : theme.colors.primary,

        color:
          loading
            ? theme.colors.textMuted
            : theme.colors.background,

        boxShadow:
          loading
            ? "none"
            : theme.shadow.neon,
      }}
    >
      {loading
        ? "Registrando..."
        : "Registrar"}
    </Button>
  );
}

function LoginLink({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-sm"
      style={{
        color:
          theme.colors.primary,
      }}
    >
      Já possui conta? Entrar
    </button>
  );
}

/* ================================================== */
/* STYLES */
/* ================================================== */

function inputClass(
  extra = ""
) {
  return `
    w-full h-14 px-4 rounded-2xl border outline-none
    ${extra}
  `;
}

function selectClass() {
  return `
    w-full h-14 px-4 rounded-2xl border outline-none
  `;
}