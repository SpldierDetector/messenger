import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let focusedChatId: number | null = null;

export function getNotificationChatId(
  value: unknown,
): number | null {
  if (
    typeof value !== 'number' &&
    typeof value !== 'string'
  ) {
    return null;
  }

  if (typeof value === 'string' && !value.trim()) {
    return null;
  }

  const chatId = Number(value);

  return Number.isSafeInteger(chatId) && chatId > 0
    ? chatId
    : null;
}

function getChatIdFromPresentedNotification(
  notification: Notifications.Notification,
): number | null {
  // Обычный способ: извлекаем chatId из данных уведомления.
  const chatIdFromData = getNotificationChatId(
    notification.request.content.data?.chatId,
  );

  if (chatIdFromData !== null) {
    return chatIdFromData;
  }

  // Android может не возвращать пользовательские данные
  // уведомлений, полученных в фоновом режиме.
  if (Platform.OS !== 'android') {
    return null;
  }

  const identifier = notification.request.identifier;

  if (
    !identifier.startsWith(
      'expo-notifications://foreign_notifications?',
    )
  ) {
    return null;
  }

  const tagParameter =
    /[?&]tag=([^&]+)/.exec(identifier);

  if (!tagParameter) {
    return null;
  }

  let tag: string;

  try {
    tag = decodeURIComponent(tagParameter[1]);
  } catch {
    return null;
  }

  // Распознаём только теги, созданные RuTsuna.
  const match =
    /^rutsuna-chat-(\d+)-message-(\d+)$/.exec(tag);

  if (!match) {
    return null;
  }

  return getNotificationChatId(match[1]);
}

export function setFocusedChatForNotifications(
  chatId: number | null,
): void {
  focusedChatId = chatId;
}

export async function dismissNotificationsForChat(
  chatId: number,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const notifications =
    await Notifications.getPresentedNotificationsAsync();

  const chatNotifications = notifications.filter(
    (notification) =>
      getChatIdFromPresentedNotification(
        notification,
      ) === chatId,
  );

  await Promise.all(
    chatNotifications.map((notification) =>
      Notifications.dismissNotificationAsync(
        notification.request.identifier,
      ),
    ),
  );
}

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const incomingChatId = getNotificationChatId(
        notification.request.content.data?.chatId,
      );

      const shouldSuppress =
        AppState.currentState === 'active' &&
        incomingChatId !== null &&
        incomingChatId === focusedChatId;
      
      return {
        shouldShowBanner: !shouldSuppress,
        shouldShowList: !shouldSuppress,
        shouldPlaySound: !shouldSuppress,
        shouldSetBadge: false,
      };
    },
  });
}