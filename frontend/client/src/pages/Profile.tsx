/**
 * @file Profile.tsx
 * @description Página de perfil do usuário autenticado.
 * Exibe avatar, estatísticas (check-ins, locais, amigos), bio e histórico de check-ins.
 * Permite editar o perfil (bio e avatar) através de um modal.
 * Oferece acesso às configurações, compartilhamento e logout via menu lateral.
 *
 * Endpoints utilizados:
 * - trpc.user.profile       → retorna { user, stats, recentCheckins }
 * - trpc.user.updateProfile → atualiza bio e avatarUrl
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
import {
  ArrowLeft,
  Grid3X3,
  Loader2,
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
 * busca dados do usuário via trpc.user.profile e coordena os sub-componentes.
 *
 * O endpoint trpc.user.profile retorna:
 * - user: dados completos do usuário (bio, avatarUrl, name, username, role)
 * - stats: { totalCheckins, uniquePlaces, avgRating }
 * - recentCheckins: últimos 5 check-ins com placeId, placeName e rating
 */
export default function Profile() {
  const [, setLocation] = useLocation();
  const { user: authUser, isAuthenticated, loading: authLoading, logout } = useAuth();
  const utils = trpc.useUtils();

  /* Estado da UI */
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Estado do formulário de edição — sincronizado com os dados do perfil */
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  /*
   * Busca o perfil completo do usuário autenticado.
   * Retorna: { user, stats: { totalCheckins, uniquePlaces }, recentCheckins }
   * Só executa quando o usuário está autenticado.
   */
  const { data: profileData, isLoading: profileLoading } = trpc.user.profile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  /*
   * Sincroniza o formulário de edição com os dados do perfil carregado.
   * Atualiza bio e avatarPreview sempre que os dados do perfil mudarem.
   */
  useEffect(() => {
    if (!profileData?.user) return;
    setBio(profileData.user.bio ?? "");
    setAvatarPreview(profileData.user.avatarUrl ?? null);
  }, [profileData]);

  /* Mutation para atualizar bio e avatarUrl do perfil */
  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Perfil atualizado com sucesso!");
      /* Invalida o cache do perfil para refletir as mudanças imediatamente */
      await utils.user.profile.invalidate();
      setEditOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao salvar perfil. Tente novamente.");
    },
  });

  /**
   * @function handleSaveProfile
   * @description Dispara a mutation de atualização do perfil com bio e avatarUrl.
   * O estado `saving` é controlado pelo isPending da mutation.
   */
  function handleSaveProfile() {
    updateProfileMutation.mutate({ bio, avatarUrl: avatarPreview });
  }

  /**
   * @function handleLogout
   * @description Executa o logout e redireciona para a página inicial.
   */
  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    setLocation("/");
  }

  /* Estado de carregamento inicial da autenticação */
  if (authLoading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: theme.colors.background }}
      >
        <Loader2 className="animate-spin" style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  /* Estado não autenticado: exibe convite para login */
  if (!isAuthenticated) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center px-4"
        style={{ background: theme.colors.background, color: theme.colors.text }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <User size={40} />
        </div>
        <h2 className="font-bold text-center">Faça login para ver seu perfil</h2>
        <p className="text-sm mt-2 text-center" style={{ color: theme.colors.textMuted }}>
          Entre para acessar seu perfil, check-ins e configurações.
        </p>
        <Button
          className="mt-5"
          style={{ background: theme.colors.primary, color: theme.colors.background }}
          onClick={() => setLocation("/login")}
        >
          Entrar
        </Button>
      </div>
    );
  }

  /* Extrai estatísticas e check-ins do perfil carregado */
  const stats = profileData?.stats;
  const recentCheckins = (profileData?.recentCheckins ?? []) as CheckinItem[];
  const totalCheckins = Number(stats?.totalCheckins ?? 0);
  const totalPlaces = Number(stats?.uniquePlaces ?? 0);

  return (
    <div
      className="flex-1 flex flex-col relative overflow-hidden"
      style={{ background: theme.colors.background, color: theme.colors.text }}
    >
      {/* Cabeçalho: botão voltar, username e menu */}
      <header
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: theme.colors.border, background: theme.colors.surface }}
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

        {/* Username exibido no centro do cabeçalho */}
        <span className="font-semibold">
          {authUser?.username || authUser?.name || "perfil"}
        </span>

        {/* Botão de menu lateral */}
        <button
          onClick={() => setMenuOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: theme.colors.surfaceSoft }}
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Conteúdo com scroll */}
      <div className="flex-1 overflow-y-auto">
        {/* Seção superior: avatar, estatísticas e bio */}
        <ProfileTop
          name={authUser?.name || "Usuário"}
          bio={bio}
          avatarPreview={avatarPreview}
          totalCheckins={totalCheckins}
          totalPlaces={totalPlaces}
          totalFriends={0}
          onEdit={() => setEditOpen(true)}
        />

        {/* Grade de check-ins recentes */}
        <CheckinsSection
          loading={profileLoading}
          checkins={recentCheckins}
          onOpen={(placeId) => setLocation(`/details/${placeId}`)}
        />
      </div>

      {/* Modal de edição de perfil */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        bio={bio}
        setBio={setBio}
        avatarPreview={avatarPreview}
        setAvatarPreview={setAvatarPreview}
        onSave={handleSaveProfile}
        saving={updateProfileMutation.isPending}
      />

      {/* Menu lateral de opções */}
      {menuOpen && (
        <SideMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onLogout={handleLogout}
          isAdmin={(authUser as any)?.role === "admin"}
          onAdmin={() => { setMenuOpen(false); setLocation("/admin"); }}
        />
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
        {/* Avatar do usuário com fallback para ícone */}
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

        {/* Estatísticas: check-ins, locais únicos e amigos */}
        <div className="flex-1 flex items-center justify-around">
          <Stat value={totalCheckins} label="checkins" />
          <Stat value={totalPlaces} label="locais" />
          <Stat value={totalFriends} label="amigos" />
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
 * @component Stat
 * @description Exibe uma estatística numérica com rótulo no perfil.
 *
 * @param value - Valor numérico da estatística
 * @param label - Rótulo descritivo abaixo do número
 */
function Stat({ value, label }: { value: number; label: string }) {
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
 * @description Grade de check-ins recentes do usuário em formato 3 colunas.
 * Exibe nome do local e avaliação em cada célula.
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

      {/* Estado de carregamento */}
      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="animate-spin" style={{ color: theme.colors.primary }} />
        </div>
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
 * Posicionado no centro da tela com overlay escuro ao fundo.
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
   * @function handleImage
   * @description Processa o upload de imagem e cria uma URL de objeto para preview.
   * Usa URL.createObjectURL para evitar conversão base64 desnecessária.
   */
  function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  return (
    <>
      {/* Overlay escuro de fundo */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(0,0,0,0.5)" }}
      />

      {/* Painel do modal centralizado */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70]">
        <div
          className="max-w-md mx-auto rounded-3xl border p-5"
          style={{
            background: theme.colors.surface,
            borderColor: theme.colors.border,
            boxShadow: theme.shadow.card,
          }}
        >
          {/* Cabeçalho do modal */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Editar perfil</h2>
            <button onClick={onClose} aria-label="Fechar">
              <X size={18} />
            </button>
          </div>

          {/* Seleção de avatar com preview */}
          <div className="flex flex-col items-center mb-5">
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mb-3"
              style={{ background: theme.colors.surfaceSoft }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <User size={32} />
              )}
            </div>
            <label
              className="cursor-pointer text-sm font-medium"
              style={{ color: theme.colors.primary }}
            >
              Alterar foto
              <input hidden type="file" accept="image/*" onChange={handleImage} />
            </label>
          </div>

          {/* Campo de bio */}
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Fale sobre você..."
            className="w-full rounded-2xl p-3 resize-none outline-none border"
            style={{
              background: theme.colors.surfaceSoft,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
          />

          {/* Botões de ação */}
          <div className="grid grid-cols-2 gap-2 mt-5">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              disabled={saving}
              style={{
                background: theme.colors.primary,
                color: theme.colors.background,
              }}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * @component SideMenu
 * @description Menu lateral deslizante com opções do perfil.
 * Inclui configurações, compartilhamento, painel admin (se admin) e logout.
 * Fecha ao clicar no overlay escuro ou no botão X.
 */
function SideMenu({
  open,
  onClose,
  onLogout,
  isAdmin,
  onAdmin,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  onAdmin: () => void;
}) {
  return (
    <>
      {/* Overlay escuro de fundo */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />

      {/* Painel lateral deslizante da direita */}
      <aside
        className={`fixed top-0 right-0 h-screen w-72 z-[9999] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: theme.colors.surface,
          borderLeft: `1px solid ${theme.colors.border}`,
        }}
      >
        <div className="h-full flex flex-col">
          {/* Cabeçalho do menu */}
          <div
            className="h-14 px-4 border-b flex items-center justify-between"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 className="font-bold">Menu</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Itens do menu */}
          <div className="p-2 space-y-1">
            <MenuButton icon={<Settings size={18} />}>
              Configurações
            </MenuButton>
            <MenuButton icon={<Share2 size={18} />}>
              Compartilhar perfil
            </MenuButton>
            {/* Painel admin: visível apenas para usuários com role "admin" */}
            {isAdmin && (
              <MenuButton icon={<Shield size={18} />} onClick={onAdmin}>
                Painel Admin
              </MenuButton>
            )}
          </div>

          {/* Botão de logout fixado no rodapé do menu */}
          <div
            className="mt-auto p-2 border-t"
            style={{ borderColor: theme.colors.border }}
          >
            <MenuButton danger icon={<LogOut size={18} color="#ef4444" />} onClick={onLogout}>
              Sair
            </MenuButton>
          </div>
        </div>
      </aside>
    </>
  );
}

/**
 * @component MenuButton
 * @description Botão de item do menu lateral.
 * Suporta estilo de "perigo" (vermelho) para ações destrutivas como logout.
 */
function MenuButton({ children, icon, danger, onClick }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full min-h-[46px] px-3 rounded-xl flex items-center gap-3 text-sm text-left"
      style={{ color: danger ? theme.colors.danger : theme.colors.text }}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
