import { useState } from 'react'
import { Platform, StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Message } from '@/components/message';
import { messages } from '@/data/message';


export default function HomeScreen() {
  const [messageList, setMessageList] = useState(messages);
  const [text, setText] = useState('');
  function handleSend() {
    console.log(text);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Messenger</Text>

      <View style={styles.messages}>
        {messageList.map((message) => {
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
      <View style={styles.inputRow}>
        <TextInput 
          value={text}
          onChangeText={setText}
          placeholder="Написать сообщение..."
          placeholderTextColor='gray'
          style={styles.input}
        />
        <Pressable
          style={styles.sendButton}
          onPress={handleSend}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
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
  input: {
    flex: 1,
    color: 'white',
    borderWidth: 1,
    borderColor: 'gray',
    padding: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: 'center',
    gap: 8,
  },
  sendButton: {
    padding: 12,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});