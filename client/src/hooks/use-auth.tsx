import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, login, signup, logout } from "@/lib/api-client";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null | undefined;
  login: (credentials: Parameters<typeof login>[0]) => Promise<User>;
  signup: (credentials: Parameters<typeof signup>[0]) => Promise<User>;
  logout: () => Promise<any>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getMe,
    retry: false, // Don't retry on 401s
  });

  const { mutateAsync: loginMutation } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });

  const { mutateAsync: signupMutation } = useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });

  const { mutateAsync: logoutMutation } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
    },
  });

  const value = {
    user,
    login: loginMutation,
    signup: signupMutation,
    logout: logoutMutation,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
