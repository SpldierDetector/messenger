import { API_BASE_URL } from '@/config/api';

import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
} from '@/types/auth';

export async function loginRequest(
  data: LoginRequest,
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to login');
  }

  return response.json();
}

export async function getCurrentUserRequest(
  token: string,
): Promise<MeResponse> {
  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok){
    throw new Error('Failed to load current user');
  }

  return response.json();
}

export async function logoutRequest(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error ('Failed to logout');
  }
}