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

/* ------------------------------------------------ */
/* Types */
/* ------------------------------------------------ */

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
  email?: string | null;
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
  setAvatarPreview: Dispatch<
    SetStateAction<string | null>
  >;
  onSave: () => void;
  saving: boolean;
};

type CheckinsSectionProps = {
  loading: boolean;
  checkins: CheckinItem[];
  onOpen: (placeId: number) => void;
};

/* ------------------------------------------------ */
/* Page */
/* ------------------------------------------------ */

export default function Profile() {
  const [, setLocation] =
    useLocation();

  const {
    user,
    isAuthenticated,
    loading,
    logout,
  } = useAuth();

  const utils = trpc.useUtils();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [bio, setBio] =
    useState("");

  const [
    avatarPreview,
    setAvatarPreview,
  ] = useState<string | null>(
    null
  );

  const {
    data: profileData,
    isLoading: profileLoading,
    refetch,
  } = trpc.user.profile.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    }
  );
  
  useEffect(() => {
    if (!profileData?.user) return;
  
    setBio(
      profileData.user.bio ?? ""
    );
  
    setAvatarPreview(
      profileData.user.avatarUrl ?? null
    );
  }, [profileData]);

  const updateProfileMutation =
    trpc.user.updateProfile.useMutation(
      {
        onSuccess:
          async () => {
            toast.success(
              "Perfil atualizado"
            );

            await utils.user.profile.invalidate();

            setEditOpen(false);
          },

        onError: (
          err
        ) => {
          toast.error(
            err.message ||
              "Erro ao salvar perfil"
          );
        },
      }
    );

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <GuestState
        onLogin={() =>
          setLocation(
            "/login"
          )
        }
      />
    );
  }

  const stats =
    profileData?.stats;

  const recentCheckins =
    (profileData?.recentCheckins ??
      []) as CheckinItem[];

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  function handleSaveProfile() {
    updateProfileMutation.mutate({
      bio,
      avatarUrl:
        avatarPreview,
    });
  }

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-x-hidden">
      <ProfileHeader
        username={
          user?.username ||
          user?.name ||
          "perfil"
        }
        onBack={() =>
          setLocation("/")
        }
        onMenu={() =>
          setMenuOpen(true)
        }
      />

      <SideMenu
        open={menuOpen}
        onClose={() =>
          setMenuOpen(false)
        }
        onLogout={
          handleLogout
        }
      />

      <EditProfileModal
        open={editOpen}
        onClose={() =>
          setEditOpen(false)
        }
        bio={bio}
        setBio={setBio}
        avatarPreview={
          avatarPreview
        }
        setAvatarPreview={
          setAvatarPreview
        }
        onSave={
          handleSaveProfile
        }
        saving={
          updateProfileMutation.isPending
        }
      />

      <div className="flex-1 overflow-y-auto">
        <ProfileTop
          name={
            user?.name ||
            "Usuário"
          }
          email={user?.email}
          bio={bio}
          avatarPreview={
            avatarPreview
          }
          totalCheckins={Number(
            stats?.totalCheckins ??
              0
          )}
          totalPlaces={Number(
            stats?.uniquePlaces ??
              0
          )}
          totalFriends={0}
          onEdit={() =>
            setEditOpen(true)
          }
        />

        <CheckinsSection
          loading={
            profileLoading
          }
          checkins={
            recentCheckins
          }
          onOpen={(
            placeId
          ) =>
            setLocation(
              `/details/${placeId}`
            )
          }
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------ */
/* Loader */
/* ------------------------------------------------ */

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" />
    </div>
  );
}

/* ------------------------------------------------ */
/* Guest */
/* ------------------------------------------------ */

function GuestState({
  onLogin,
}: {
  onLogin: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <User size={40} />

      <h2 className="font-bold mt-4">
        Faça login para ver seu perfil
      </h2>

      <Button
        className="mt-4"
        onClick={onLogin}
      >
        Entrar
      </Button>
    </div>
  );
}

/* ------------------------------------------------ */
/* Header */
/* ------------------------------------------------ */

function ProfileHeader({
  username,
  onBack,
  onMenu,
}: {
  username: string;
  onBack: () => void;
  onMenu: () => void;
}) {
  return (
    <header className="px-4 py-3 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onBack}>
          <ArrowLeft size={20} />
        </button>

        <h1 className="font-bold">
          {username}
        </h1>
      </div>

      <button onClick={onMenu}>
        <Menu size={22} />
      </button>
    </header>
  );
}

/* ------------------------------------------------- */
/* Side Menu */
/* ------------------------------------------------- */

function SideMenu({
  open,
  onClose,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  async function handleShare() {
    const url =
      window.location.origin +
      "/profile";

    if (navigator.share) {
      try {
        await navigator.share({
          title:
            "Meu perfil JoinMe",
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(
        url
      );
    }

    onClose();
  }

  return (
    <>
      {/* overlay */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-black/50
          transition-opacity duration-300
          ${
            open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
      />

      {/* panel */}
      <aside
        className={`
          fixed top-0 right-0 h-screen w-72 z-50
          bg-card border-l border-border
          transition-transform duration-300 ease-out
          will-change-transform
          ${
            open
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
      >
        <div className="h-full flex flex-col">
          <div className="h-14 px-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold">
              Menu
            </h2>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-2 space-y-1">
            <MenuButton
              icon={
                <Settings size={18} />
              }
            >
              Configurações
            </MenuButton>

            <MenuButton
              icon={
                <Share2 size={18} />
              }
              onClick={
                handleShare
              }
            >
              Compartilhar perfil
            </MenuButton>

            <MenuButton
              icon={
                <Shield size={18} />
              }
            >
              Privacidade
            </MenuButton>
          </div>

          <div className="mt-auto p-2 border-t border-border">
            <MenuButton
              danger
              icon={
                <LogOut size={18} />
              }
              onClick={
                onLogout
              }
            >
              Sair
            </MenuButton>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------- */
/* Menu Button */
/* ------------------------------------------------- */

function MenuButton({
  children,
  icon,
  danger,
  onClick,
}: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full min-h-[46px]
        px-3 rounded-xl
        flex items-center gap-3
        text-sm text-left
        transition-colors
        hover:bg-secondary
        active:scale-[0.99]

        ${
          danger
            ? "text-destructive hover:bg-destructive/10"
            : ""
        }
      `}
    >
      <span className="shrink-0">
        {icon}
      </span>

      <span>
        {children}
      </span>
    </button>
  );
}

/* ------------------------------------------------- */
/* Edit Profile Modal */
/* ------------------------------------------------- */

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

  function handleImage(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const url =
      URL.createObjectURL(
        file
      );

    setAvatarPreview(url);
  }

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
      />

      {/* modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70]">
        <div className="bg-card border border-border rounded-3xl shadow-2xl p-5 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              Editar perfil
            </h2>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary"
            >
              <X size={18} />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-5">
            <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden flex items-center justify-center mb-3">
              {avatarPreview ? (
                <img
                  src={
                    avatarPreview
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} />
              )}
            </div>

            <label className="cursor-pointer text-sm text-primary font-medium">
              Alterar foto

              <input
                hidden
                type="file"
                accept="image/*"
                onChange={
                  handleImage
                }
              />
            </label>
          </div>

          {/* Bio */}
          <label className="text-sm font-medium block mb-2">
            Biografia
          </label>

          <textarea
            rows={4}
            value={bio}
            onChange={(e) =>
              setBio(
                e.target.value
              )
            }
            placeholder="Fale sobre você..."
            className="
              w-full rounded-2xl border border-border
              bg-background p-3 resize-none
              outline-none focus:ring-2 focus:ring-primary
            "
          />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 mt-5">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>

            <Button
              onClick={onSave}
              disabled={saving}
            >
              {saving
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------ */
/* Top */
/* ------------------------------------------------ */

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
        <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
          {avatarPreview ? (
            <img
              src={
                avatarPreview
              }
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={34} />
          )}
        </div>

        <div className="flex-1 flex items-center justify-around">
          <Stat
            value={
              totalCheckins
            }
            label="checkins"
          />

          <Stat
            value={
              totalPlaces
            }
            label="locais"
          />

          <Stat
            value={
              totalFriends
            }
            label="amigos"
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="font-semibold">
          {name}
        </p>

        <p className="text-sm mt-1">
          {bio}
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full mt-4"
        onClick={onEdit}
      >
        <Pencil
          size={14}
          className="mr-2"
        />
        Editar perfil
      </Button>
    </div>
  );
}

function Stat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="text-center">
      <p className="font-bold text-lg">
        {value}
      </p>

      <p className="text-xs text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------ */
/* Checkins */
/* ------------------------------------------------ */

function CheckinsSection({
  loading,
  checkins,
  onOpen,
}: CheckinsSectionProps) {
  return (
    <div className="mt-6 border-t border-border">
      <div className="h-12 flex items-center justify-center border-b border-border">
        <Grid3X3 size={18} />
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : checkins.length ===
        0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          Nenhum check-in ainda.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[2px] bg-border">
          {checkins.map(
            (
              item
            ) => (
              <button
                key={
                  item.id
                }
                onClick={() =>
                  onOpen(
                    item.placeId
                  )
                }
                className="aspect-square bg-card flex flex-col items-center justify-center p-2 hover:bg-secondary"
              >
                <p className="text-[11px] font-semibold text-center line-clamp-2">
                  {
                    item.placeName
                  }
                </p>

                <p className="text-[10px] text-muted-foreground mt-1">
                  ⭐ {
                    item.rating
                  }
                  /5
                </p>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}