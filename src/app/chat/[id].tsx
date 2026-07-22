import { chats } from '@/data/chat';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Message } from '@/components/message';
import { useMessages } from '@/providers/messages-provider';
import { styles } from '@/styles/chat.styles';
import {
  formatMessageDate,
  formatMessageTime,
  isSameDay
} from '@/utils/date';


export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { 
    messages,
    sendMessage,
    isLoaded,
    isSending,
    error
  } = useMessages();

  const chat = chats.find((item) => item.id.toString() === id);
  const currentChatId = Number(id);

  const messageList = messages.filter(
    (message) => message.chatId === currentChatId
  );
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);
  const isSendDisabled = !text.trim() || isSending;

  async function handleSend() {
    if (!text.trim()) {
      return;
    }
    
    const wasSent = await sendMessage(currentChatId, text);
    if (wasSent) {setText('');}
  }
  if (!chat) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundTitle}>Чат не найден</Text>

        <Pressable
          style={styles.notFoundButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.notFoundButtonText}>
            Вернуться к чатам
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  } 

  if (!isLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable 
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{chat.name[0]}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{chat.name}</Text>
            <Text style={styles.headerStatus}>
              {chat.isOnline ? 'online' : 'offline'}
            </Text>
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
          renderItem={({ item, index }) => {
            const previousMessage = messageList[index - 1];

            const shouldShowDate =
              !previousMessage ||
              !isSameDay(
                previousMessage.createdAt,
                item.createdAt
              );

            return (
              <View>
                {shouldShowDate && (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>
                      {formatMessageDate(item.createdAt)}
                    </Text>
                  </View>
                )}

                <Message
                  author={
                    item.isOwn
                      ? item.author
                      : chat.name ?? item.author
                  }
                  text={item.text}
                  time={formatMessageTime(item.createdAt)}
                  isOwn={item.isOwn}
                />
              </View>
            )
          }}
        />

        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}

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
            style={({ pressed }) => [
              styles.sendButton, 
              isSendDisabled && styles.sendButtonDisabled,
              pressed && !isSendDisabled && styles.sendButtonPressed,
            ]}
            onPress={handleSend}
            disabled={isSendDisabled}
          >
            <Text style={styles.sendButtonText}>
              {isSending ? '...' : 'Send'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


