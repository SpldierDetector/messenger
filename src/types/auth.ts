export type AuthUser = {
  id: number;
  name: string;
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