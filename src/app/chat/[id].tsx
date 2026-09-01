import { getChatRequest } from '@/services/chat-api';
import type { ChatData } from '@/types/chat';
import type { MessageData } from '@/types/message';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { 
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Message } from '@/components/message';
import { useMessages } from '@/providers/messages-provider';
import { styles } from '@/styles/chat.styles';
import {
  formatMessageDate,
  formatMessageTime,
  isSameDay
} from '@/utils/date';
import { useAuth } from '@/providers/auth-provider';


export default function ChatScreen() {
  const { id } = useLocalSearchParams();

  const { 
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMessages,
    isLoaded,
    isSending,
    error
  } = useMessages();

  const { token, isAuthenticated } = useAuth();

  const chatId = Number(id);

  const [chat, setChat] = useState<ChatData | null>(null);
  const [isChatLoaded, setIsChatLoaded] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [
    selectedMessage,
    setSelectedMessage,
  ] = useState<MessageData | null>(null);

  useEffect(() => {
    if (!Number.isFinite(chatId)) {
      setIsChatLoaded(true);
      return;
    }

    if (!isAuthenticated || !token) {
      return;
    }

    loadMessages(chatId);

    getChatRequest(chatId, token)
      .then((loadedChat) => {
        setChat(loadedChat);
      })
      .catch((error) => {
        console.error(`Failed to load chat:`, error);
      })
      .finally(() => {
        setIsChatLoaded(true);
      });
  }, [chatId,isAuthenticated, token,]);
  
  const messageList = messages
    .filter(
      (message) => 
        message.chatId === chatId &&
        message.deletedAt === null,
    )
    .sort(
      (firstMessage, secondMessage) =>
        firstMessage.createdAt - 
        secondMessage.createdAt,
    );
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);
  const isSendDisabled = !text.trim() || isSending || isEditing;

  function handleBackPress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }

  function handleStartEditing(
    messageId: number,
    messageText: string,
  ) {
    setEditingMessageId(messageId);
    setText(messageText);
  }

  function handleCancelEditing() {
    setEditingMessageId(null);
    setText('');
  }

  async function handleSend() {
    const normalizedText = text.trim();

    if (!normalizedText) {
      return;
    }

    if (editingMessageId !== null) {
      try {
        setIsEditing(true);

        const wasEdited = await editMessage(
          editingMessageId,
          normalizedText,
        );

        if (wasEdited) {
          setText('');
          setEditingMessageId(null);
        }
      } finally {
        setIsEditing(false);
      }

      return;
    }

    const wasSent = await sendMessage(
      chatId,
      normalizedText,
    );

    if (wasSent) {
      setText('');
    }
  }
  
  if (!isChatLoaded) {
    return null;
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
            onPress={handleBackPress}
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
                  editedAt={item.editedAt}
                  deletedAt={item.deletedAt}
                  onLongPress={
                    item.isOwn && item.deletedAt === null
                      ? () => setSelectedMessage(item)
                      : undefined                  
                  }
                />
              </View>
            )
          }}
        />

        <Modal
          visible={selectedMessage !== null}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setSelectedMessage(null)
          }
        >
          <View style={styles.messageMenuRoot}>
            <Pressable
              style={styles.messageMenuBackdrop}
              onPress={() =>
                setSelectedMessage(null)
              }
            />

            <View style={styles.messageMenu}>
              <Pressable
                style={styles.messageMenuItem}
                onPress={() =>{
                  if (!selectedMessage) {
                    return;
                  }

                  handleStartEditing(
                    selectedMessage.id,
                    selectedMessage.text,
                  );

                  setSelectedMessage(null);
                }}
              >
                <Text style={styles.messageMenuText}>
                  Редактировать
                </Text>
              </Pressable>
              <Pressable
                style={styles.messageMenuItem}
                onPress={async () => {
                  if (!selectedMessage) {
                    return;
                  }

                  const messageId =
                    selectedMessage.id;

                  setSelectedMessage(null);

                  await deleteMessage(messageId);
                }}
              >
                <Text style={styles.deleteMessageMenuText}>
                  Удалить
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}

        {editingMessageId !== null && (
          <View style={styles.editingBar}>
            <View style={styles.editingInfo}>
              <Text style={styles.editingTitle}>
                Редактирование сообщения
              </Text>

              <Text
                style={styles.editingText}
                numberOfLines={1}
              >
                {text}
              </Text>
            </View>

            <Pressable
              onPress={handleCancelEditing}
              style={styles.cancelEditButton}
            >
              <Text style={styles.cancelEditButtonText}>
                ✕
              </Text>
            </Pressable>
          </View>
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
              {isSending || isEditing
                ? '...' 
                : editingMessageId !== null
                  ? 'Save'
                  : 'Send'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


