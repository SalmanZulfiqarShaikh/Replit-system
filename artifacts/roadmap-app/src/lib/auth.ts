import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AuthUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}

function getApiBase(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, "");
  return (import.meta.env.BASE_URL as string).replace(/\/$/, "");
}

export function useAuth() {
  const queryClient = useQueryClient();
  const API_BASE = getApiBase();

  const { data, isLoading } = useQuery<{ user: AuthUser | null }>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/auth/user`, {
        credentials: "include",
      });
      if (!res.ok) return { user: null };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const user = data?.user ?? null;
  const isAuthenticated = !!user;

  const login = async (password: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Login failed" }));
      throw new Error(err.error || "Wrong password");
    }

    await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
  };

  const logout = async (): Promise<void> => {
    await fetch(`${API_BASE}/api/logout`, {
      method: "POST",
      credentials: "include",
    });
    await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
  };

  return { user, isLoading, isAuthenticated, login, logout };
}
