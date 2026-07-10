import { useState, useRef } from 'react'
import { Platform, KeyboardAvoidingView, FlatList } from 'react-native';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Message } from '@/components/message';
import { messages } from '@/data/message';
import { styles } from './index.styles';


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

