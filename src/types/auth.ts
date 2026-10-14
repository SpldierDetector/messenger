export type AuthUser = {
  id: number;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  avatarFullUrl: string | null;
};

export type LoginRequest = {
  login: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
};

export type RegisterRequest = {
  name: string;
  login: string;
  password: string;
};

export type UpdateProfileRequest = {
  name: string;
  bio: string | null;
};

export type UpdateProfileResponse = {
  user: AuthUser;
};