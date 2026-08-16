import { API_BASE_URL } from '@/config/api';
import type { UserData } from '@/types/user';

export async function searchUsersRequest(
  search: string,
  token: string,
): Promise<UserData[]> {
  const response = await fetch(
    `${API_BASE_URL}/users?search=${encodeURIComponent(search)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      'Failed to search users:',
      response.status,
      errorBody,
    );

    throw new Error(
      `Failed to search users: ${response.status}`,
    );
  }

  return response.json();
}