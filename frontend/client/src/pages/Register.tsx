/**
 * @file Register.tsx
 * @description Página de registro de novo usuário.
 * Coleta nome, username, email, senha, gênero e data de nascimento.
 * Redireciona para a página inicial após registro bem-sucedido.
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
 * @component Register
 * @description Formulário de registro com múltiplos campos.
 * Valida os dados antes de enviar e exibe erros via toast.
 */
export default function Register() {
  const [, setLocation] = useLocation();

  /* Estado dos campos do formulário */
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* Mutation de registro via tRPC */
  const registerMutation = trpc.auth.register.useMutation();
  const utils = trpc.useUtils();

  /**
   * @function handleSubmit
   * @description Processa o envio do formulário de registro.
   * Monta a data de nascimento a partir dos campos separados.
   * Em caso de sucesso, invalida o cache e redireciona para a home.
   */
  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();

    /* Monta a data de nascimento no formato ISO (YYYY-MM-DD) */
    const birthDate =
      day && month && year
        ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        : undefined;

    try {
      await registerMutation.mutateAsync({
        name,
        username,
        email,
        gender,
        password,
        birthDate: birthDate as string,
      });
      await utils.auth.me.invalidate();
      setLocation("/");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao registrar. Tente novamente.");
    }
  }

  const loading = registerMutation.isPending;

  return (
    <div
      className="flex-1 min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: theme.colors.background, color: theme.colors.text }}
    >
      <div className="w-full max-w-sm">
        {/* Logo e título */}
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
          <h1 className="text-2xl font-bold">Criar conta</h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
            Preencha os dados para se registrar
          </p>
        </div>

        {/* Formulário de registro */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de nome completo */}
          <InputField
            label="Nome completo"
            placeholder="Seu nome"
            value={name}
            onChange={setName}
          />

          {/* Campo de nome de usuário */}
          <InputField
            label="Username"
            placeholder="@seunome"
            value={username}
            onChange={setUsername}
          />

          {/* Campo de email */}
          <InputField
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChange={setEmail}
            type="email"
          />

          {/* Campo de senha com botão de visibilidade */}
          <PasswordField
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          {/* Campo de gênero */}
          <div>
            <label className="text-sm font-semibold block mb-2">Gênero</label>
            <SelectField
              value={gender}
              onChange={setGender}
              placeholder="Selecione"
              options={[
                { value: "male", label: "Masculino" },
                { value: "female", label: "Feminino" },
                { value: "other", label: "Outro" },
              ]}
            />
          </div>

          {/* Campos de data de nascimento */}
          <BirthDateFields
            day={day}
            month={month}
            year={year}
            setDay={setDay}
            setMonth={setMonth}
            setYear={setYear}
          />

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
            {loading ? "Registrando..." : "Registrar"}
          </Button>
        </form>

        {/* Link para login */}
        <button
          type="button"
          onClick={() => setLocation("/login")}
          className="w-full text-sm mt-4"
          style={{ color: theme.colors.primary }}
        >
          Já possui conta? Entrar
        </button>
      </div>
    </div>
  );
}

/* ================================================== */
/* COMPONENTES INTERNOS */
/* ================================================== */

/**
 * @component InputField
 * @description Campo de input genérico com label.
 * Aplica os estilos do tema centralizado.
 */
function InputField({ label, placeholder, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-sm font-semibold block mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass()}
      />
    </div>
  );
}

/**
 * @component PasswordField
 * @description Campo de senha com botão para alternar visibilidade.
 * Usa o ícone Eye/EyeOff para indicar o estado atual.
 */
function PasswordField({ password, setPassword, showPassword, setShowPassword }: any) {
  return (
    <div>
      <label className="text-sm font-semibold block mb-2">Senha</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputClass("pr-12")}
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
  );
}

/**
 * @component BirthDateFields
 * @description Campos de data de nascimento divididos em dia, mês e ano.
 * Usa selects separados para facilitar a entrada em dispositivos móveis.
 */
function BirthDateFields({ day, month, year, setDay, setMonth, setYear }: any) {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return (
    <div>
      <label className="text-sm font-semibold block mb-2">Data de nascimento</label>
      <div className="grid grid-cols-3 gap-3">
        {/* Seletor de dia */}
        <SelectField
          value={day}
          onChange={setDay}
          placeholder="Dia"
          options={Array.from({ length: 31 }, (_, i) => ({
            value: String(i + 1),
            label: String(i + 1),
          }))}
        />
        {/* Seletor de mês */}
        <SelectField
          value={month}
          onChange={setMonth}
          placeholder="Mês"
          options={months.map((item, index) => ({
            value: String(index + 1),
            label: item,
          }))}
        />
        {/* Seletor de ano */}
        <SelectField
          value={year}
          onChange={setYear}
          placeholder="Ano"
          options={Array.from({ length: 80 }, (_, i) => ({
            value: String(2026 - i),
            label: String(2026 - i),
          }))}
        />
      </div>
    </div>
  );
}

/**
 * @component SelectField
 * @description Campo de seleção (dropdown) genérico.
 * Aplica os estilos do tema centralizado.
 */
function SelectField({ value, onChange, placeholder, options }: any) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={selectClass()}
    >
      <option value="">{placeholder}</option>
      {options.map((item: any) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

/* ================================================== */
/* UTILITÁRIOS DE ESTILO */
/* ================================================== */

/**
 * @function inputClass
 * @description Retorna a classe CSS padrão para campos de input.
 * @param extra - Classes CSS adicionais
 */
function inputClass(extra = "") {
  return `w-full h-14 px-4 rounded-2xl border outline-none transition-colors ${extra}`;
}

/**
 * @function selectClass
 * @description Retorna a classe CSS padrão para campos de select.
 */
function selectClass() {
  return "w-full h-14 px-4 rounded-2xl border outline-none transition-colors";
}
