import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/styles/index.styles';

import { ChatPreview } from '@/components/chat-preview';
import { useMessages } from '@/providers/messages-provider';
import { getChatsRequest } from '@/services/chat-api';
import type { ChatData } from '@/types/chat';
import { sortChatsByLatestMessage } from '@/utils/chat';
import { formatChatPreviewDate } from '@/utils/date';
import { getLastMessage } from '@/utils/message';


export default function ChatListScreen() {
  const [chats, setChats] = useState<ChatData[]>([]);

  const { 
    messages, 
    loadLatestMessagePreviews, 
  } = useMessages();

  useEffect(() => {
    loadLatestMessagePreviews();

    getChatsRequest()
      .then((loadedChats) => {
        setChats(loadedChats);
      })
      .catch((error) => {
        console.error('Failed to load chats:', error);
      });
  }, []);

  const sortedChats = sortChatsByLatestMessage(chats, messages);
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Voxa</Text>

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

