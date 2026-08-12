import {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from 'react';

import { loginRequest } from '@/services/auth-api';
import type {
  AuthUser,
  LoginRequest,
} from '@/types/auth';

type AuthContextData = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextData | null>(
  null
);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function login(data: LoginRequest) {
    const response = await loginRequest(data);

    setUser(response.user);
    setToken(response.token);
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  const isAuthenticated = user !== null && token !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error (
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}