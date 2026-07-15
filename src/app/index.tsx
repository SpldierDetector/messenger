import { router, type Href } from 'expo-router';
import { FlatList, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/styles/index.styles';

import { ChatPreview } from '@/components/chat-preview';
import { chats } from '@/data/chat';
import { useMessages } from '@/providers/messages-provider';
import { getLastMessage } from '@/utils/message';


export default function ChatListScreen() {
  const { messages } = useMessages();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Voxa</Text>

      <FlatList
        data={chats}
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
                time={lastMessage?.time ?? ''}
                isOnline={item.isOnline}
              />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
  
}

