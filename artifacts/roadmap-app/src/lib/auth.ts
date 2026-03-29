export function useAuth() {
  const user = {
    id: "salman-001",
    email: "ss3000569@gmail.com",
    firstName: "Salman",
    lastName: "Zulfiqar",
    profileImageUrl: null as string | null,
  };

  return {
    user,
    isLoading: false,
    isAuthenticated: true,
    login: async (_password: string) => {},
    logout: async () => {},
  };
}
