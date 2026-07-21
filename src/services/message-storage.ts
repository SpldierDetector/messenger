import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MessageData } from '@/types/message';

const MESSAGES_STORAGE_KEY = 'voxa_messages';

export async function saveMessages(
  messages: MessageData[]
) {
  const serializedMessages = JSON.stringify(messages);

  await AsyncStorage.setItem(
    MESSAGES_STORAGE_KEY,
    serializedMessages
  );
}

export async function loadMessages() {
  const serializedMessages = await AsyncStorage.getItem(
    MESSAGES_STORAGE_KEY
  );

  if (!serializedMessages) {
    return null;
  }

  return JSON.parse(serializedMessages) as MessageData[];
}