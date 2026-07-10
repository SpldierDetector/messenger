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
  const isSendDisabled = !text.trim();
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
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Alex</Text>
            <Text style={styles.headerStatus}>online</Text>
          </View>

          <Pressable style={({ pressed }) => [styles.callButton,
          pressed && styles.callButtonPressed,]}>
            <Text style={styles.callButtonText}>📞</Text>
          </Pressable>
        </View>
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
            multiline
          />
          <Pressable
            style={({ pressed }) => [styles.sendButton, 
              isSendDisabled && styles.sendButtonDisabled,
              pressed && !isSendDisabled && styles.sendButtonPressed,]}
            onPress={handleSend}
            disabled={isSendDisabled}
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
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: "row",
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    marginBottom: 10,
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
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonPressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  headerStatus: {
    color: '#22c55e',
    fontSize: 13,
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3f3f46',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 18,
  },
  callButtonPressed:{
    opacity: 0.7,
  }
});