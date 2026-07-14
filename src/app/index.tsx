import { router, type Href } from 'expo-router'
import { Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/styles/index.styles';

import { ChatPreview } from '@/components/chat-preview';
import { chats } from '@/data/chat';
import { useMessages } from '@/providers/messages-provider';


export default function ChatListScreen() {
  const { messages } = useMessages();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Voxa</Text>

      <FlatList
        data={chats}
        keyExtractor={(chat) => chat.id.toString()}
        renderItem={({ item }) => {
          const chatMessages = messages.filter(
            (message) => message.chatId === item.id
          );

          const lastMessage = chatMessages.at(-1);
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
                lastMessage={lastMessage?.text ?? item.lastMessage}
                time={item.time}
                isOnline={item.isOnline}
              />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
  
}

