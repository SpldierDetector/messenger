import type {
  UserData,
  UserRow,
} from '../types/user.js'

export function mapUserRow(row: unknown): UserData {
  const user = row as UserRow;

  return {
    id: user.id,
    name: user.name,
  };
}