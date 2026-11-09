import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  useRootNavigationState,
  useRouter,
} from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/providers/auth-provider';
import { getNotificationChatId } from '@/services/chat-notifications';

function NativePushNotificationNavigation() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isAuthLoading, isAuthenticated } = useAuth();

  const response = Notifications.useLastNotificationResponse();

  const handledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !response ||
      isAuthLoading ||
      !navigationState?.key
    ) {
      return;
    }

    const notificationId = response.notification.request.identifier;

    if (handledIdRef.current === notificationId) {
      return;
    }

    handledIdRef.current = notificationId;

    Notifications.clearLastNotificationResponse();

    if (
      response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    const chatId = getNotificationChatId(
      response.notification.request.content.data?.chatId,
    );

    if (chatId === null) {
      return;
    }

    console.log('[push] Opening chat:', chatId);

    router.navigate({
      pathname: '/chat/[id]',
      params: {
        id: String(chatId),
      },
    });
  }, [
    response,
    isAuthLoading,
    isAuthenticated,
    navigationState?.key,
    router,
  ]);

  return null;
}

export function PushNotificationNavigation() {
  if (Platform.OS === 'web') {
    return null;
  }

  return <NativePushNotificationNavigation />
}