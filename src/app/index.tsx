import { useState, useRef } from 'react'
import { Platform, KeyboardAvoidingView, FlatList } from 'react-native';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Message } from '@/components/message';
import { messages } from '@/data/message';


export default function HomeScreen() {
  const [messageList, setMessageList] = useState(messages);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);
  function handleSend() {
    if (!text.trim()){
      return;
    }

    const now = new Date();

    const time = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
    ).padStart(2, '0')}`;

    const newMessage = {
      id: Date.now(),
      author: 'Me',
      text: text.trim(),
      time: time,
      isOwn: true,
    };
    
    setMessageList([...messageList, newMessage]);
    setText('')
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Messenger</Text>
        <FlatList
          ref={listRef}
          style={styles.messages}
          data={messageList}
          onContentSizeChange={() => {listRef.current?.scrollToEnd({animated: true});
        }}
          keyExtractor={(message) => message.id.toString()}
          renderItem={({ item }) => (
            <Message
              author={item.author}
              text={item.text}
              time={item.time}
              isOwn={item.isOwn}
            />
          )}
        />
        <View style={styles.inputRow}>
          <TextInput 
            value={text}
            onChangeText={setText}
            placeholder="Написать сообщение..."
            placeholderTextColor='gray'
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            multiline
          />
          <Pressable
            style={styles.sendButton}
            onPress={handleSend}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    flex: 1,
  },
  input: {
    flex: 1,
    color: 'white',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: "row",
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2563eb'
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});