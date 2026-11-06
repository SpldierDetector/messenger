import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { registerDevicePushToken } from '@/services/push-device';

export function PushRegistration() {
  const {
    token,
    isAuthenticated,
    isAuthLoading,
  } = useAuth();

  useEffect(() => {
    if (
      isAuthLoading ||
      !isAuthenticated ||
      !token
    ) {
      return;
    }

    void registerDevicePushToken(token)
      .catch((error) => {
        console.error(
          '[push] Ошибка регистрации устройства:',
          error,
        );
      });
  }, [token, isAuthenticated, isAuthLoading]);

  return null;
}