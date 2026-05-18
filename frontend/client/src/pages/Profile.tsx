/**
 * @file Profile.tsx
 * @description Página de perfil do usuário autenticado.
 * Exibe avatar, estatísticas (check-ins, locais, amigos), bio e histórico de check-ins.
 * Permite editar o perfil (bio e avatar) através de um modal.
 * Oferece acesso às configurações, compartilhamento e logout.
 */

import {
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
} from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import {
  ArrowLeft,
  Grid3X3,
  LogOut,
  Menu,
  Settings,
  Share2,
  Shield,
  User,
  X,
  Pencil,
} from "lucide-react";

/* ================================================== */
/* TIPOS */
/* ================================================== */

/** Representa um item de check-in no histórico do usuário */
type CheckinItem = {
  id: number;
  placeId: number;
  placeName: string;
  rating: number;
};

type MenuButtonProps = {
  children: ReactNode;
  icon: ReactNode;
  danger?: boolean;
  onClick?: () => void;
};

type ProfileTopProps = {
  name: string;
  bio: string;
  avatarPreview: string | null;
  totalCheckins: number;
  totalPlaces: number;
  totalFriends: number;
  onEdit: () => void;
};

type EditProfileModalProps = {
  open: boolean;
  onClose: () => void;
  bio: string;
  setBio: Dispatch<SetStateAction<string>>;
  avatarPreview: string | null;
  setAvatarPreview: Dispatch<SetStateAction<string | null>>;
  onSave: () => void;
  saving: boolean;
};

type CheckinsSectionProps = {
  loading: boolean;
  checkins: CheckinItem[];
  onOpen: (placeId: number) => void;
};

/* ================================================== */
/* PÁGINA PRINCIPAL */
/* ================================================== */

/**
 * @component Profile
 * @description Página de perfil do usuário. Gerencia o estado de edição,
 * busca dados do usuário e seus check-ins, e coordena os sub-componentes.
 */
export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const utils = trpc.useUtils();

  /* Estado da UI */
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Estado do formulário de edição */
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  /* Sincroniza o estado do formulário com os dados do usuário */
  useEffect(() => {
    if (user) {
      setBio((user as any).bio ?? "");
      setAvatarPreview((user as any).avatar ?? null);
    }
  }, [user]);

  /* Busca os check-ins do usuário autenticado */
  const { data: checkins, isLoading: checkinsLoading } = trpc.checkins.myCheckins.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  /* Mutation para atualizar o perfil */
  const updateProfile = trpc.users.updateProfile.useMutation();

  /**
   * @function handleSaveProfile
   * @description Salva as alterações do perfil (bio e avatar).
   * Invalida o cache do usuário após salvar para refletir as mudanças.
   */
  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ bio, avatar: avatarPreview ?? undefined });
      await utils.auth.me.invalidate();
      setEditOpen(false);
      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  /* Redireciona para login se não autenticado */
  if (!isAuthenticated && !loading) {
    return (
      <div
        className="flex-1 min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: theme.colors.background, color: theme.colors.text }}
      >
        <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
          Você precisa estar logado para ver seu perfil.
        </p>
        <Button
          onClick={() => setLocation("/login")}
          style={{ background: theme.colors.primary, color: theme.colors.background }}
        >
          Entrar
        </Button>
      </div>
    );
  }

  /* Estado de carregamento inicial */
  if (loading) {
    return (
      <div
        className="flex-1 min-h-screen flex flex-col"
        style={{ background: theme.colors.background }}
      >
        <LoadingState className="flex-1" />
      </div>
    );
  }

  /* Estatísticas do perfil */
  const totalCheckins = checkins?.length ?? 0;
  const totalPlaces = new Set(checkins?.map((c: any) => c.placeId)).size;
  const totalFriends = (user as any)?.friendsCount ?? 0;

  return (
    <div
      className="flex-1 min-h-screen flex flex-col max-w-lg mx-auto"
      style={{ background: theme.colors.background, color: theme.colors.text }}
    >
      {/* Barra de navegação superior */}
      <nav
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: theme.colors.border }}
      >
        {/* Botão de voltar */}
        <button
          onClick={() => setLocation("/")}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: theme.colors.surfaceSoft }}
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Nome do usuário no centro */}
        <span className="font-semibold">{user?.name ?? "Perfil"}</span>

        {/* Botão de menu de opções */}
        <button
          onClick={() => setMenuOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: theme.colors.surfaceSoft }}
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>
      </nav>

      {/* Seção superior: avatar, estatísticas e bio */}
      <ProfileTop
        name={user?.name ?? ""}
        bio={bio}
        avatarPreview={avatarPreview}
        totalCheckins={totalCheckins}
        totalPlaces={totalPlaces}
        totalFriends={totalFriends}
        onEdit={() => setEditOpen(true)}
      />

      {/* Grade de check-ins do usuário */}
      <CheckinsSection
        loading={checkinsLoading}
        checkins={(checkins as CheckinItem[]) ?? []}
        onOpen={(placeId) => setLocation(`/details/${placeId}`)}
      />

      {/* Modal de edição de perfil */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        bio={bio}
        setBio={setBio}
        avatarPreview={avatarPreview}
        setAvatarPreview={setAvatarPreview}
        onSave={handleSaveProfile}
        saving={saving}
      />

      {/* Menu lateral de opções */}
      {menuOpen && (
        <MenuOverlay onClose={() => setMenuOpen(false)}>
          <MenuButton icon={<Share2 size={18} />} onClick={() => setMenuOpen(false)}>
            Compartilhar perfil
          </MenuButton>
          <MenuButton icon={<Settings size={18} />} onClick={() => setMenuOpen(false)}>
            Configurações
          </MenuButton>
          {(user as any)?.role === "admin" && (
            <MenuButton
              icon={<Shield size={18} />}
              onClick={() => { setMenuOpen(false); setLocation("/admin"); }}
            >
              Painel Admin
            </MenuButton>
          )}
          <MenuButton
            icon={<LogOut size={18} />}
            danger
            onClick={async () => { setMenuOpen(false); await logout(); }}
          >
            Sair
          </MenuButton>
        </MenuOverlay>
      )}
    </div>
  );
}

/* ================================================== */
/* COMPONENTES INTERNOS */
/* ================================================== */

/**
 * @component ProfileTop
 * @description Seção superior do perfil com avatar, estatísticas e bio.
 * Exibe um avatar circular com fallback de ícone e três métricas principais.
 */
function ProfileTop({
  name,
  bio,
  avatarPreview,
  totalCheckins,
  totalPlaces,
  totalFriends,
  onEdit,
}: ProfileTopProps) {
  return (
    <div className="px-4 pt-5">
      <div className="flex gap-5">
        {/* Avatar do usuário com fallback */}
        <div
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
          style={{ background: theme.colors.surfaceSoft }}
        >
          {avatarPreview ? (
            <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" />
          ) : (
            <User size={34} />
          )}
        </div>

        {/* Estatísticas: check-ins, locais e amigos */}
        <div className="flex-1 flex items-center justify-around">
          <ProfileStat value={totalCheckins} label="checkins" />
          <ProfileStat value={totalPlaces} label="locais" />
          <ProfileStat value={totalFriends} label="amigos" />
        </div>
      </div>

      {/* Nome e bio do usuário */}
      <div className="mt-4">
        <p className="font-semibold">{name}</p>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          {bio}
        </p>
      </div>

      {/* Botão de editar perfil */}
      <Button variant="outline" className="w-full mt-4" onClick={onEdit}>
        <Pencil size={14} className="mr-2" />
        Editar perfil
      </Button>
    </div>
  );
}

/**
 * @component ProfileStat
 * @description Exibe uma estatística numérica com rótulo no perfil.
 *
 * @param value - Valor numérico da estatística
 * @param label - Rótulo descritivo
 */
function ProfileStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-bold text-lg">{value}</p>
      <p className="text-xs" style={{ color: theme.colors.textMuted }}>
        {label}
      </p>
    </div>
  );
}

/**
 * @component CheckinsSection
 * @description Grade de check-ins do usuário em formato 3 colunas.
 * Exibe nome do local e avaliação em cada célula.
 * Usa LoadingState centralizado durante o carregamento.
 */
function CheckinsSection({ loading, checkins, onOpen }: CheckinsSectionProps) {
  return (
    <div className="mt-6 border-t" style={{ borderColor: theme.colors.border }}>
      {/* Ícone de grade como separador de seção */}
      <div
        className="h-12 flex items-center justify-center border-b"
        style={{ borderColor: theme.colors.border }}
      >
        <Grid3X3 size={18} />
      </div>

      {/* Estado de carregamento — usa LoadingState centralizado */}
      {loading ? (
        <LoadingState />
      ) : checkins.length === 0 ? (
        /* Estado vazio */
        <div className="p-6 text-center text-sm" style={{ color: theme.colors.textMuted }}>
          Nenhum check-in ainda.
        </div>
      ) : (
        /* Grade de check-ins */
        <div className="grid grid-cols-3 gap-[2px]" style={{ background: theme.colors.border }}>
          {checkins.map((item) => (
            <button
              key={item.id}
              onClick={() => onOpen(item.placeId)}
              className="aspect-square flex flex-col items-center justify-center p-2"
              style={{ background: theme.colors.surface }}
            >
              <p className="text-[11px] font-semibold text-center line-clamp-2">
                {item.placeName}
              </p>
              <p className="text-[10px] mt-1" style={{ color: theme.colors.textMuted }}>
                ⭐ {item.rating}/5
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * @component EditProfileModal
 * @description Modal de edição do perfil do usuário.
 * Permite alterar a bio e o avatar (via upload de imagem).
 */
function EditProfileModal({
  open,
  onClose,
  bio,
  setBio,
  avatarPreview,
  setAvatarPreview,
  onSave,
  saving,
}: EditProfileModalProps) {
  if (!open) return null;

  /**
   * @function handleAvatarChange
   * @description Processa o upload de imagem e converte para base64 para preview.
   */
  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <>
      {/* Overlay escuro de fundo */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: theme.colors.mapOverlay }}
        onClick={onClose}
      />

      {/* Painel do modal */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl p-6"
        style={{ background: theme.colors.surface }}
      >
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Editar perfil</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: theme.colors.surfaceSoft }}
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Seleção de avatar */}
        <div className="flex justify-center mb-6">
          <label className="cursor-pointer">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: theme.colors.surfaceSoft }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <User size={28} />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        {/* Campo de bio */}
        <div className="mb-6">
          <label className="text-sm font-semibold block mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Fale um pouco sobre você..."
            className="w-full px-4 py-3 rounded-2xl border outline-none resize-none"
            style={{
              background: theme.colors.surfaceSoft,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
          />
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={saving}
            style={{
              background: theme.colors.primary,
              color: theme.colors.background,
            }}
            onClick={onSave}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * @component MenuOverlay
 * @description Overlay de menu lateral com opções do perfil.
 * Fecha ao clicar fora ou no botão de fechar.
 */
function MenuOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <>
      {/* Fundo escuro clicável para fechar */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: theme.colors.mapOverlay }}
        onClick={onClose}
      />

      {/* Painel do menu */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-72 p-6 flex flex-col"
        style={{ background: theme.colors.surface }}
      >
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="self-end w-9 h-9 rounded-xl flex items-center justify-center mb-6"
          style={{ background: theme.colors.surfaceSoft }}
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>

        {/* Itens do menu */}
        <div className="space-y-2">{children}</div>
      </div>
    </>
  );
}

/**
 * @component MenuButton
 * @description Botão de item do menu lateral.
 * Suporta estilo de "perigo" (vermelho) para ações destrutivas como logout.
 */
function MenuButton({ children, icon, danger = false, onClick }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition"
      style={{
        background: theme.colors.surfaceSoft,
        color: danger ? theme.colors.destructive : theme.colors.text,
      }}
    >
      {icon}
      <span className="font-medium">{children}</span>
    </button>
  );
}
