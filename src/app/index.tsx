import { router, type Href } from 'expo-router'
import { Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/styles/index.styles';

import { ChatPreview } from '@/components/chat-preview';
import { chats } from '@/data/chat';


export default function ChatListScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Voxa</Text>

      <FlatList
        data={chats}
        keyExtractor={(chat) => chat.id.toString()}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              router.push(`/chat/${item.id}` as Href);
            }}
          >
            <ChatPreview
              name={item.name}
              lastMessage={item.lastMessage}
              time={item.time}
              isOnline={item.isOnline}
            />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
  
}

