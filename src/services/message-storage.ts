import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MessageData } from '@/types/message';

const MESSAGES_STORAGE_KEY = 'voxa_messages';

export async function saveMessages(
  messages: MessageData[]
) {
  try {
    const serializedMessages = JSON.stringify(messages);

    await AsyncStorage.setItem(
      MESSAGES_STORAGE_KEY,
      serializedMessages
    );
  } catch (error) {
    console.error('Failed to save messages:', error)
  }
}

export async function loadMessages() {
  try {
    const serializedMessages = await AsyncStorage.getItem(
      MESSAGES_STORAGE_KEY
    );

    if (!serializedMessages) {
      return null;
    }

    return JSON.parse(serializedMessages) as MessageData[];
  } catch (error) {
    console.error('Failed to load messages:', error);

    return null;
  }
}