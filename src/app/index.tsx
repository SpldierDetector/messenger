import { router, type Href, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/styles/index.styles';

import { ChatPreview } from '@/components/chat-preview';
import { useMessages } from '@/providers/messages-provider';
import { getChatsRequest } from '@/services/chat-api';
import type { ChatData } from '@/types/chat';
import { sortChatsByLatestMessage } from '@/utils/chat';
import { formatChatPreviewDate } from '@/utils/date';
import { getLastMessage } from '@/utils/message';
import { useAuth } from '@/providers/auth-provider';


export default function ChatListScreen() {
  const [chats, setChats] = useState<ChatData[]>([]);
  const { 
    isAuthenticated, 
    isAuthLoading, 
    logout,
  } = useAuth();

  const { 
    messages, 
    loadLatestMessagePreviews, 
  } = useMessages();

  useEffect(() => {
    if (
      isAuthLoading ||
      !isAuthenticated
    ) {
      return;
    }

    loadLatestMessagePreviews();

    getChatsRequest()
      .then((loadedChats) => {
        setChats(loadedChats);
      })
      .catch((error) => {
        console.error('Failed to load chats:', error);
      });
  }, [isAuthLoading, isAuthenticated]);

  if (isAuthLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const sortedChats = sortChatsByLatestMessage(chats, messages);
  
  async function handleLogout() {
    await logout();
    router.replace('/login');
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voxa</Text>

        <Pressable 
          onPress={handleLogout}
          style={({ pressed}) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
        >
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </Pressable>
      </View>

      <FlatList
        data={sortedChats}
        keyExtractor={(chat) => chat.id.toString()}
        renderItem={({ item }) => {
          const lastMessage = getLastMessage(messages, item.id);
          
          return (
            <Pressable
            style={({ pressed }) => [
              styles.chatPreview,
              pressed && styles.chatPreviewPressed,
            ]}  
            onPress={() => {
                router.push(`/chat/${item.id}` as Href);
              }}
            >
              <ChatPreview
                name={item.name}
                lastMessage={lastMessage?.text ?? 'Нет сообщений'}
                time={lastMessage ? formatChatPreviewDate(lastMessage.createdAt) : ''}
                isOnline={item.isOnline}
              />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
  
}

