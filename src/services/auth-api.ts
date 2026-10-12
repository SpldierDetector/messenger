import { API_BASE_URL } from '@/config/api';
import { ApiError } from './api-error';

import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
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
    throw new ApiError(
      'Login request failed',
      response.status,
    );
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
    throw new ApiError(
      'Failed to load current user',
      response.status,
    );
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
    throw new ApiError(
      'Failed to logout',
      response.status,
    );
  }
}

export async function registerRequest(
  data: RegisterRequest,
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_BASE_URL}/auth/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new ApiError(
      'Register request failed',
      response.status,
    );
  }

  return response.json();
}

export async function updateProfileRequest(
  token: string,
  data: UpdateProfileRequest,
): Promise<UpdateProfileResponse> {
  const response = await fetch(
    `${API_BASE_URL}/users/me`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new ApiError(
      'Failed to update profile',
      response.status,
    );
  }

  return response.json();
}