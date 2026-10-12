export type UserRow = {
  id: number;
  name: string;
  login: string | null;
  passwordHash: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

export type UserData = {
  id: number;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
};