import type {
  UserData,
  UserRow,
} from '../types/user.js'

export function mapUserRow(row: unknown): UserData {
  return row as UserRow;
}