/**
 * Authentication hook for the frontend.
 * Replace this with your actual auth implementation.
 *
 * The original Manus OAuth hook has been removed.
 * Implement your preferred auth strategy (JWT, session, etc.)
 */
import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading: loading, error } = trpc.auth.me.useQuery();

  return {
    user: user ?? null,
    loading,
    error,
    isAuthenticated: !!user,
    logout: () => {
      // TODO: Implement logout
      window.location.href = "/";
    },
  };
}
