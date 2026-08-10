export type UserRow = {
  id: number;
  name: string;
  login: string | null;
  passwordHash: string | null;
};

export type UserData = {
  id: number;
  name: string;
};