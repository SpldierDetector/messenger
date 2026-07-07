import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Message } from '@/components/message';
import { messages } from '@/data/message';


export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Messenger</Text>

      <View style={styles.messages}>
        {messages.map((message) => {
          return (
            <Message
              key={message.id}
              author={message.author}
              text={message.text}
              time={message.time}
              isOwn={message.isOwn}
            />
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'black',
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  messages: {
    gap: 8,
  },
});