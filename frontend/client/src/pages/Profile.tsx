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
  setBio: Dispatch<
    SetStateAction<string>
  >;
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
  onOpen: (
    placeId: number
  ) => void;
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

  const utils =
    trpc.useUtils();

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
  } =
    trpc.user.profile.useQuery(
      undefined,
      {
        enabled:
          isAuthenticated,
      }
    );

  useEffect(() => {
    if (
      !profileData?.user
    )
      return;

    setBio(
      profileData.user.bio ??
        ""
    );

    setAvatarPreview(
      profileData.user
        .avatarUrl ??
        null
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

  if (loading)
    return <PageLoader />;

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
    updateProfileMutation.mutate(
      {
        bio,
        avatarUrl:
          avatarPreview,
      }
    );
  }

  return (
    <div
      className="flex-1 flex flex-col relative overflow-hidden"
      style={{
        background:
          theme.colors.background,
        color:
          theme.colors.text,
      }}
    >
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
      <Loader2
        className="animate-spin"
        style={{
          color:
            theme.colors.primary,
        }}
      />
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
        style={{
          background:
            theme.colors.primary,
          color:
            theme.colors.background,
        }}
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
    <header
      className="px-4 py-3 border-b flex items-center justify-between"
      style={{
        borderColor:
          theme.colors.border,
        background:
          theme.colors.surface,
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
        >
          <ArrowLeft
            size={20}
          />
        </button>

        <h1 className="font-bold">
          {username}
        </h1>
      </div>

      <button
        onClick={onMenu}
      >
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
      window.location
        .origin +
      "/profile";

    if (navigator.share) {
      try {
        await navigator.share(
          {
            title:
              "Meu perfil JoinMe",
            url,
          }
        );
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
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{
          background:
            "rgba(0,0,0,0.5)",
        }}
      />

      <aside
        className={`fixed top-0 right-0 h-screen w-72 z-50 transition-transform duration-300 ${
          open
            ? "translate-x-0"
            : "translate-x-full"
        }`}
        style={{
          background:
            theme.colors.surface,
          borderLeft: `1px solid ${theme.colors.border}`,
        }}
      >
        <div className="h-full flex flex-col">
          <div
            className="h-14 px-4 border-b flex items-center justify-between"
            style={{
              borderColor:
                theme.colors.border,
            }}
          >
            <h2 className="font-bold">
              Menu
            </h2>

            <button
              onClick={
                onClose
              }
              className="w-10 h-10 rounded-full flex items-center justify-center"
            >
              <X
                size={18}
              />
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

          <div
            className="mt-auto p-2 border-t"
            style={{
              borderColor:
                theme.colors.border,
            }}
          >
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

/* ------------------------------------------------ */
/* Menu Button */
/* ------------------------------------------------ */

function MenuButton({
  children,
  icon,
  danger,
  onClick,
}: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full min-h-[46px] px-3 rounded-xl flex items-center gap-3 text-sm text-left"
      style={{
        color: danger
          ? theme.colors.danger
          : theme.colors.text,
      }}
    >
      {icon}
      <span>
        {children}
      </span>
    </button>
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
  if (!open)
    return null;

  function handleImage(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target
        .files?.[0];

    if (!file) return;

    const url =
      URL.createObjectURL(
        file
      );

    setAvatarPreview(
      url
    );
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[60]"
        style={{
          background:
            "rgba(0,0,0,0.5)",
        }}
      />

      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70]">
        <div
          className="max-w-md mx-auto rounded-3xl border p-5"
          style={{
            background:
              theme.colors.surface,
            borderColor:
              theme.colors.border,
            boxShadow:
              theme.shadow.card,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              Editar perfil
            </h2>

            <button
              onClick={
                onClose
              }
            >
              <X
                size={18}
              />
            </button>
          </div>

          <div className="flex flex-col items-center mb-5">
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mb-3"
              style={{
                background:
                  theme.colors.surfaceSoft,
              }}
            >
              {avatarPreview ? (
                <img
                  src={
                    avatarPreview
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <User
                  size={32}
                />
              )}
            </div>

            <label
              className="cursor-pointer text-sm font-medium"
              style={{
                color:
                  theme.colors.primary,
              }}
            >
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

          <textarea
            rows={4}
            value={bio}
            onChange={(
              e
            ) =>
              setBio(
                e.target
                  .value
              )
            }
            placeholder="Fale sobre você..."
            className="w-full rounded-2xl p-3 resize-none outline-none border"
            style={{
              background:
                theme.colors.surfaceSoft,
              borderColor:
                theme.colors.border,
            }}
          />

          <div className="grid grid-cols-2 gap-2 mt-5">
            <Button
              variant="outline"
              onClick={
                onClose
              }
            >
              Cancelar
            </Button>

            <Button
              onClick={
                onSave
              }
              disabled={
                saving
              }
              style={{
                background:
                  theme.colors.primary,
                color:
                  theme.colors.background,
              }}
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
        <div
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            background:
              theme.colors.surfaceSoft,
          }}
        >
          {avatarPreview ? (
            <img
              src={
                avatarPreview
              }
              className="w-full h-full object-cover"
            />
          ) : (
            <User
              size={34}
            />
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

        <p
          className="text-sm mt-1"
          style={{
            color:
              theme.colors.textMuted,
          }}
        >
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

      <p
        className="text-xs"
        style={{
          color:
            theme.colors.textMuted,
        }}
      >
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
    <div
      className="mt-6 border-t"
      style={{
        borderColor:
          theme.colors.border,
      }}
    >
      <div
        className="h-12 flex items-center justify-center border-b"
        style={{
          borderColor:
            theme.colors.border,
        }}
      >
        <Grid3X3
          size={18}
        />
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2
            className="animate-spin"
            style={{
              color:
                theme.colors.primary,
            }}
          />
        </div>
      ) : checkins.length ===
        0 ? (
        <div
          className="p-6 text-center text-sm"
          style={{
            color:
              theme.colors.textMuted,
          }}
        >
          Nenhum check-in ainda.
        </div>
      ) : (
        <div
          className="grid grid-cols-3 gap-[2px]"
          style={{
            background:
              theme.colors.border,
          }}
        >
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
                className="aspect-square flex flex-col items-center justify-center p-2"
                style={{
                  background:
                    theme.colors.surface,
                }}
              >
                <p className="text-[11px] font-semibold text-center line-clamp-2">
                  {
                    item.placeName
                  }
                </p>

                <p
                  className="text-[10px] mt-1"
                  style={{
                    color:
                      theme.colors.textMuted,
                  }}
                >
                  ⭐{" "}
                  {
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