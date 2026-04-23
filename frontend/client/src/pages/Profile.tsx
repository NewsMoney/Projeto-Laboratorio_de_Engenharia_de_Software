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
  Camera,
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

/* ------------------------------------------------ */
/* Side Menu */
/* ------------------------------------------------ */

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
      await navigator.share({
        title:
          "Meu perfil JoinMe",
        url,
      });
    } else {
      await navigator.clipboard.writeText(
        url
      );
    }

    onClose();
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`
          absolute inset-0 bg-black/50 z-40 transition-opacity
          ${
            open
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }
        `}
      />

      <div className="absolute top-0 right-0 h-full w-72 overflow-hidden z-50">
        <div
          className={`
            h-full bg-card border-l border-border transition-transform duration-300
            ${
              open
                ? "translate-x-0"
                : "translate-x-full"
            }
          `}
        >
          <div className="p-4 border-b border-border flex justify-between">
            <h2 className="font-bold">
              Menu
            </h2>

            <button
              onClick={onClose}
            >
              <X size={20} />
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
      </div>
    </>
  );
}

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
        w-full h-11 px-3 rounded-xl flex items-center gap-3 text-sm
        hover:bg-secondary
        ${
          danger
            ? "text-destructive"
            : ""
        }
      `}
    >
      {icon}
      {children}
    </button>
  );
}

/* ------------------------------------------------ */
/* Top */
/* ------------------------------------------------ */

function ProfileTop({
  name,
  email,
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

        {email && (
          <p className="text-sm text-muted-foreground">
            {email}
          </p>
        )}

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
/* Edit Modal */
/* ------------------------------------------------ */

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
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 z-50"
      />

      <div className="absolute inset-x-4 top-20 bg-card border border-border rounded-2xl z-50 p-5 shadow-2xl">
        <h2 className="font-bold text-lg mb-4">
          Editar perfil
        </h2>

        <label className="block text-sm mb-2">
          Foto
        </label>

        <label className="h-12 rounded-xl border border-border flex items-center justify-center gap-2 cursor-pointer mb-4">
          <Camera size={16} />
          Escolher imagem

          <input
            hidden
            type="file"
            accept="image/*"
            onChange={
              handleImage
            }
          />
        </label>

        <label className="block text-sm mb-2">
          Bio
        </label>

        <textarea
          rows={4}
          value={bio}
          onChange={(e) =>
            setBio(
              e.target.value
            )
          }
          className="w-full rounded-xl border border-border bg-background p-3 resize-none"
        />

        <div className="grid grid-cols-2 gap-2 mt-4">
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
    </>
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