import { getChatsRequest } from '@/services/chat-api';
import type { ChatData } from '@/types/chat';
import { useAuth } from '@/providers/auth-provider';
import { useMessages } from '@/providers/messages-provider';
import { styles } from '@/styles/forward-message.style';

import { Href, router, useLocalSearchParams} from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForwardMessageScreen() {
  const { messageId } = useLocalSearchParams();

  const { token, isAuthenticated } = useAuth();
  const { forwardMessage } = useMessages();

  const [chats, setChats] = useState<ChatData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceMessageId = Number(messageId);
  
  useEffect(() =>{
    if (!isAuthenticated || !token) {
      return;
    }

    getChatsRequest(token)
    .then((loadedChats) => {
      setChats(loadedChats);
    })
    .catch((caughtError) =>{
      console.error(
        'Failed to load chats for forwarding:',
        caughtError,
      );

      setError(
        'Не удалось загрузить список чатов',
      );
    })
    .finally(() =>{
      setIsLoaded(true);
    });
  }, [isAuthenticated, token]);

  function handleBackPress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }

  async function handleSelectChat(
    chatId: number,
  ) {
    if (
      isForwarding ||
      !Number.isInteger(sourceMessageId) ||
      sourceMessageId <= 0
    ) {
      return;
    }

    try {
      setIsForwarding(true);
      setError(null);

      const wasForwarded = await forwardMessage(
        sourceMessageId,
        chatId,
      );

      if (!wasForwarded) {
        return;
      }

      router.replace(
        `/chat/${chatId}` as Href,
      );
    } finally {
      setIsForwarding(false);
    }
  }

  if (!isLoaded) {
    return null;
  }

  if (
    !Number.isInteger(sourceMessageId) ||
    sourceMessageId <= 0
  ) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>
          Некорректное сообщение
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>
            ←
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Переслать сообщение
        </Text>
      </View>

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      <FlatList
        data={chats}
        keyExtractor={(chat) =>
          chat.id.toString()
        }
        contentContainerStyle={
          styles.chatList
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.chatItem,
              pressed &&
                styles.chatItemPressed,
            ]}
            disabled={isForwarding}
            onPress={() =>
              handleSelectChat(item.id)
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name[0]}
              </Text>
            </View>

            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>
                {item.name}
              </Text>

              <Text style={styles.chatStatus}>
                {item.isOnline
                  ? 'online'
                  : 'offline'}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}