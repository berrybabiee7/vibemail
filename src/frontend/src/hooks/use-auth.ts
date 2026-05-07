import { useInternetIdentity } from "@caffeineai/core-infrastructure";

export function useAuth() {
  const { identity, loginStatus, login, clear, isInitializing } =
    useInternetIdentity();

  const isAuthenticated = loginStatus === "success" && identity !== undefined;
  const isLoading = isInitializing;
  const principal = identity?.getPrincipal() ?? null;

  return {
    identity,
    principal,
    isAuthenticated,
    isLoading,
    loginStatus,
    login,
    logout: clear,
  };
}
