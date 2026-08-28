import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { 
  getCurrentUserRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
} from '@/services/auth-api';

import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '@/types/auth';

import { 
  deleteSessionToken,
  getSessionToken,
  saveSessionToken,
} from '@/services/session-storage';

type AuthContextData = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
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
  const [ isAuthLoading, setIsAuthLoading, ] = useState(true);

  const isAuthenticated = 
    user !== null &&
    token !== null;

  useEffect(() => {
    async function restoreSession() {
      try {
        const savedToken =
          await getSessionToken();
        
        if (!savedToken) {
          return;
        }

        const response =
          await getCurrentUserRequest(
            savedToken,
          );

        setToken(savedToken);
        setUser(response.user);
      } catch (error) {
        console.error(
          'Failed to restore session:',
          error,
        );

        await deleteSessionToken();
      } finally {
        setIsAuthLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(data: LoginRequest) {
    const response = await loginRequest(data);

    await saveSessionToken(response.token);

    setUser(response.user);
    setToken(response.token);
  }

  async function register(data: RegisterRequest,) {
    const response = await registerRequest(data);

    await saveSessionToken(
      response.token,
    );

    setUser(response.user);
    setToken(response.token);
  }

  async function logout() {
    try {
      if (token) {
        await logoutRequest(token);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      await deleteSessionToken();

      setUser(null);
      setToken(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAuthLoading,
        login,
        register,
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