import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_TOKEN_KEY = 'voxa_session_token';

export async function saveSessionToken(
  token: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(
      SESSION_TOKEN_KEY,
      token,
    );

    return;
  }

  await SecureStore.setItemAsync(
    SESSION_TOKEN_KEY,
    token,
  );
}

export async function getSessionToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(
      SESSION_TOKEN_KEY,
    );
  }

  return SecureStore.getItemAsync(
    SESSION_TOKEN_KEY,
  );
}

export async function deleteSessionToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(
      SESSION_TOKEN_KEY,
    );

    return;
  }

  await SecureStore.deleteItemAsync(
    SESSION_TOKEN_KEY,
  );
}