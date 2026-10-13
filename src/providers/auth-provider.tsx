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
  updateProfileRequest,
} from '@/services/auth-api';

import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from '@/types/auth';

import { 
  deleteSessionToken,
  getSessionToken,
  saveSessionToken,
} from '@/services/session-storage';

import type {
  DocumentPickerAsset,
} from 'expo-document-picker';

import {
  uploadAvatarRequest,
  deleteAvatarRequest,
} from '@/services/avatar-api';

import { ApiError } from '@/services/api-error';

type AuthContextData = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<AuthUser>;
  uploadAvatar: (asset: DocumentPickerAsset) => Promise<AuthUser>;
  deleteAvatar: () => Promise<AuthUser>;
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
        if (
          error instanceof ApiError &&
          error.status === 401
        ) {
          await deleteSessionToken();

          return;
        }

        if (error instanceof TypeError) {
          console.log(
            'Failed to restore session: server is unavailable',
          );

          return;
        }

        console.error(
          'Unexpected session restore error:',
          error,
        );
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
      if (error instanceof TypeError) {
        console.log(
          'Logout request failed: server is unavailable',
        );

        return;
      }

      if (
        error instanceof ApiError &&
        error.status === 401
      ) {
        console.log(
          'Logout request skipped: session is already invalid',
        );

        return;
      }

      console.error(
        'Unexpected logout error:',
        error,
      );
    } finally {
      await deleteSessionToken();

      setUser(null);
      setToken(null);
    }
  }

  async function updateProfile(
    data: UpdateProfileRequest,
  ): Promise<AuthUser> {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await updateProfileRequest(
      token,
      data,
    );;

    setUser(response.user);

    return response.user;
  }

  async function uploadAvatar(
    asset: DocumentPickerAsset,
  ): Promise<AuthUser> {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await uploadAvatarRequest(
      token,
      asset,
    );

    setUser(response.user);
    return response.user;
  }

  async function deleteAvatar(): Promise<AuthUser> {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await deleteAvatarRequest(token);

    setUser(response.user);
    return response.user;
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
        updateProfile,
        uploadAvatar,
        deleteAvatar,
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