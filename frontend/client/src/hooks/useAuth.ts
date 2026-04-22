import { trpc } from "@/lib/trpc";

export function useAuth() {
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading: loading,
    error,
  } = trpc.auth.me.useQuery();

  const logoutMutation =
    trpc.auth.logout.useMutation();

  async function logout() {
    await logoutMutation.mutateAsync();

    await utils.auth.me.invalidate();

    window.location.href = "/";
  }

  return {
    user: user ?? null,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
  };
}