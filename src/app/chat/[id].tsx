import { Message } from '@/components/message';
import { useAuth } from '@/providers/auth-provider';
import { useMessages } from '@/providers/messages-provider';
import { uploadAttachment } from '@/services/attachments-service';
import { getChatRequest } from '@/services/chat-api';
import { styles } from '@/styles/chat.styles';
import type { ChatData } from '@/types/chat';
import type { MessageData } from '@/types/message';
import {
  formatMessageDate,
  formatMessageTime,
  isSameDay
} from '@/utils/date';
import * as DocumentPicker from 'expo-document-picker';
import {
  Href,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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


export default function ChatScreen() {
  const TYPING_STOP_DELAY = 1500;
  const MESSAGE_SEARCH_DELAY = 400;
  const { id } = useLocalSearchParams();

  const { 
    messages,
    receipts,
    typingUserIdsByChat,
    onlineByChat,
    isRealtimeConnected,
    lastSeenByChat,
    messageSearchResults,
    isSearchingMessages,
    messageSearchError,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    deleteMessageForMe,
    loadMessages,
    loadOlderMessages,
    hasMoreMessagesByChat,
    isLoadingOlderMessagesByChat,
    searchMessagesInChat,
    clearMessageSearch,
    isLoaded,
    isSending,
    markChatRead,
    startTyping,
    stopTyping,
    error
  } = useMessages();

  const { token, isAuthenticated } = useAuth();
  const chatId = Number(id);
  const [chat, setChat] = useState<ChatData | null>(null);
  const [chatLoadError, setChatLoadError] = useState<string | null>(null);
  const [isChatLoaded, setIsChatLoaded] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const realtimeIsOnline = onlineByChat[chatId];
  const isCompanionOnline = realtimeIsOnline ?? chat?.isOnline ?? false;
  const companionLastSeenAt = lastSeenByChat[chatId] ?? chat?.lastSeenAt?? null;
  const [
    selectedMessage,
    setSelectedMessage,
  ] = useState<MessageData | null>(null);
  const [
    isMessageMenuVisible,
    setIsMessageMenuVisible,
  ] = useState(false);
  const [replyingMessage, setReplyingMessage] = useState<MessageData | null>(null);
  const [text, setText] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSearchPending, setIsSearchPending] = useState(false);
  const [messageSearchText, setMessageSearchText] = useState('');
  const [isInitialMessagePositionReady, setIsInitialMessagePositionReady] = useState(false);
  const listRef = useRef<FlatList>(null);
  const hasInitialScrollCompletedRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const isInitialScrollScheduledRef = useRef(false);
  const isChatFocusedRef = useRef(false);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const isCompanionTyping = (typingUserIdsByChat[chatId]?.length ?? 0) > 0;

  useEffect(() => {
    if (!Number.isFinite(chatId)) {
      setIsChatLoaded(true);
      return;
    }

    if (!isAuthenticated || !token) {
      return;
    }

    let isActive = true;

    setIsChatLoaded(false);
    setChatLoadError(null);

    void loadMessages(chatId)
      .catch((error) => {
        console.warn(
          'Failed to load messages:',
          error,
        );
      });

    getChatRequest(chatId, token)
      .then((loadedChat) => {
        if (!isActive) {
          return;
        }

        setChat(loadedChat);
      })
      .catch((error) => {
        console.warn(`Failed to load chat:`, error);

        if (!isActive) {
          return;
        }

        setChatLoadError(
          'Не удалось загрузить чат. Проверьте подключение к сети.',
        );
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setIsChatLoaded(true);
      });
      return () => {
        isActive = false;
      };
  }, [chatId,isAuthenticated, token,]);

  useEffect(() => {
    hasInitialScrollCompletedRef.current = false;
    isInitialScrollScheduledRef.current = false;
    isNearBottomRef.current = true;

    setIsInitialMessagePositionReady(false);
  }, [chatId]);

  useEffect(() => {
    if (
      !isSearchMode ||
      !Number.isFinite(chatId)
    ) {
      setIsSearchPending(false);
      return;
    }

    const query = messageSearchText.trim();

    if (!query) {
      setIsSearchPending(false);
      clearMessageSearch();

      return;
    }

    setIsSearchPending(true);

    const timeoutId = setTimeout(
      () => {
        setIsSearchPending(false);

        void searchMessagesInChat(
          chatId,
          query,
        );
      },
      MESSAGE_SEARCH_DELAY,
    );

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    isSearchMode,
    messageSearchText,
    chatId,
  ]);

  useFocusEffect(
    useCallback(() => {
      isChatFocusedRef.current = true;
      
      if (
        Number.isFinite(chatId) &&
        isAuthenticated &&
        chat?.id === chatId &&
        !chatLoadError
      ) {
        markChatRead(chatId);
      }

      return () => {
        isChatFocusedRef.current = false;

        clearMessageSearch();

        if (typingStopTimerRef.current) {
          clearTimeout(typingStopTimerRef.current);

          typingStopTimerRef.current = null;
        }

        if (
          Number.isFinite(chatId) &&
          isTypingRef.current
        ) {
          stopTyping(chatId);

          isTypingRef.current = false;
        }
      };
    },  [
      chatId,
      chat?.id,
      chatLoadError,
      isAuthenticated,
      markChatRead,
      stopTyping,
    ]), 
  );

  const handlePickAttachment = async () => {
    if (!token) {
      return;
    }

    const result =
      await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    try {
      const attachment =
        await uploadAttachment(
          chatId,
          asset,
          token,
        );

      console.log(
        'Uploaded attachment:',
        attachment,
      );
    } catch (error) {
      console.error(
        'Failed to upload attachment:',
        error,
      );
    }
  };
  
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

  const searchResultList = [
    ...messageSearchResults,
  ].sort(
    (firstMessage, secondMessage) =>
      firstMessage.createdAt -
      secondMessage.createdAt,
  );

  const displayedMessages = 
    isSearchMode
      ? searchResultList
      : messageList;
  const latestMessage = messageList[messageList.length - 1];
  const hasMoreMessages = hasMoreMessagesByChat[chatId] ?? false;
  const isLoadingOlderMessages = isLoadingOlderMessagesByChat[chatId] ?? false;
  const isSendDisabled = !text.trim() || isEditing;

  useEffect(() => {
    if (
      isSearchMode ||
      !latestMessage ||
      !hasInitialScrollCompletedRef.current ||
      !isNearBottomRef.current
    ) {
      return;
    }

    const frameId =
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({
          animated: true,
        });
      });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    latestMessage?.id,
    isSearchMode,
  ]);
  
  useEffect(() => {
    if (
      !isChatFocusedRef.current ||
      !isAuthenticated ||
      !Number.isFinite(chatId) ||
      !latestMessage ||
      latestMessage.isOwn
    ) {
      return;
    }

    markChatRead(
      chatId,
    );
  }, [
    chatId,
    isAuthenticated,
    latestMessage?.id,
    markChatRead,
  ]);

  function handleMessagesScroll(
    offsetY: number,
    viewportHeight: number,
    contentHeight: number,
  ) {
    const BOTTOM_THRESHOLD = 120;
    const TOP_THRESHOLD = 100;

    isNearBottomRef.current =
      offsetY + viewportHeight >=
      contentHeight - BOTTOM_THRESHOLD;

    if (
      !hasInitialScrollCompletedRef.current &&
      isNearBottomRef.current
    ) {
      hasInitialScrollCompletedRef.current = true;

      setIsInitialMessagePositionReady(true);

      return;
    }

    if (
      isSearchMode ||
      !hasInitialScrollCompletedRef.current ||
      isLoadingOlderMessages ||
      !hasMoreMessages ||
      offsetY > TOP_THRESHOLD
    ) {
      return;
    }

    void loadOlderMessages(chatId);
  }
  
  function handleOpenMessageMenu(
    message: MessageData,
  ) {
    setSelectedMessage(message);
    setIsMessageMenuVisible(true);;
  }

  function handleCloseMessageMenu() {
    setIsMessageMenuVisible(false);
  }

  function handleBackPress() {
    if (isSearchMode) {
      handleCloseSearch();
      return;
    }
    
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }

  function handleOpenSearch() {
    handleStopTyping();

    setIsSearchMode(true);
    setMessageSearchText('');
    setIsSearchPending(false);
    clearMessageSearch();
  }

  function handleCloseSearch() {
    setIsSearchMode(false);
    setMessageSearchText('');
    setIsSearchPending(false);
    clearMessageSearch();
  }

  function handleStartEditing(
    messageId: number,
    messageText: string,
  ) {
    setReplyingMessage(null);
    setEditingMessageId(messageId);
    setText(messageText);
  }

  function handleCancelEditing() {
    handleStopTyping();
    
    setEditingMessageId(null);
    setText('');
  }

  function handleStartReply(
    message: MessageData,
  ) {
    handleStopTyping();

    setEditingMessageId(null);
    setText('');
    setReplyingMessage(message);
    handleCloseMessageMenu();
  }

  function handleCancelReply() {
    setReplyingMessage(null);
  }

  function handleStartForward(
    messageId: number,
  ) {
    handleCloseMessageMenu();

    router.push(
      `/forward-message?messageId=${messageId}` as Href,
    );
  }

  function handleStopTyping() {
    if (typingStopTimerRef.current) {
      clearTimeout(
        typingStopTimerRef.current,
      );

      typingStopTimerRef.current = null;
    }

    if (!isTypingRef.current) {
      return;
    }

    stopTyping(chatId);

    isTypingRef.current = false;
  }

  function handleTextChange(
    value: string,
  ) {
    setText(value);

    if (
      !isAuthenticated ||
      !Number.isFinite(chatId)
    ) {
      return;
    }

    if (!value.trim()) {
      handleStopTyping();

      return;
    }

    if (!isTypingRef.current) {
      startTyping(chatId);

      isTypingRef.current = true;
    }

    if (typingStopTimerRef.current) {
      clearTimeout(
        typingStopTimerRef.current,
      );
    }

    typingStopTimerRef.current =
      setTimeout(() => {
        stopTyping(chatId);

        isTypingRef.current = false;
        typingStopTimerRef.current = null;
      }, TYPING_STOP_DELAY);
  }

  function formatLastSeen(
    lastSeenAt: number | null,
  ) {
    if (!lastSeenAt) {
      return 'offline';
    }

    const now = new Date();
    const lastSeenDate = new Date(lastSeenAt);
    
    const sameDay =
      now.getFullYear() === lastSeenDate.getFullYear() &&
      now.getMonth() === lastSeenDate.getMonth() &&
      now.getDate() === lastSeenDate.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const wasYesterday =
      yesterday.getFullYear() === lastSeenDate.getFullYear() &&
      yesterday.getMonth() === lastSeenDate.getMonth() &&
      yesterday.getDate() === lastSeenDate.getDate();

    const time =
      lastSeenDate.toLocaleTimeString(
        'ru-RU',
        {
          hour: '2-digit',
          minute: '2-digit',
        },
      );
    if (sameDay) {
      return `был сегодня в ${time}`;
    }

    if (wasYesterday) {
      return `был вчера в ${time}`;
    }

    const date =
      lastSeenDate.toLocaleDateString(
        'ru-RU',
        {
          day: 'numeric',
          month: 'long',
        },
      );

    return `был ${date} в ${time}`;
  }

  async function handleSend() {
    const normalizedText = text.trim();

    if (!normalizedText) {
      return;
    }

    handleStopTyping();

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

    const replyToMessageId = replyingMessage?.id ?? null;

    setText('');
    setReplyingMessage(null);

    void sendMessage(
      chatId,
      normalizedText,
      replyToMessageId,
    );
  }
  
  if (!isChatLoaded) {
    return null;
  }

  if (chatLoadError) {
    return (
      <SafeAreaView
        style={styles.notFoundContainer}
      >
        <Text style={styles.notFoundTitle}>
          Нет соединения
        </Text>

        <Text style={styles.errorText}>
          {chatLoadError}
        </Text>

        <Pressable
          style={styles.notFoundButton}
          onPress={() => router.back()}
          >
            <Text style={styles.notFoundButtonText}>
              Вернуться к чатам
            </Text>
          </Pressable>
      </SafeAreaView>
    );
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

          {isSearchMode ? (
            <>
              <TextInput
                value={messageSearchText}
                onChangeText={setMessageSearchText}
                placeholder="Поиск по сообщениям"
                placeholderTextColor="#777777"
                autoFocus
                autoCorrect={false}
                style={styles.searchInput}
              />

              <Pressable
                onPress={handleCloseSearch}
                style={({ pressed }) => [
                  styles.closeSearchButton,
                  pressed &&
                    styles.searchButtonPressed,
                ]}
              >
                <Text style={styles.closeSearchButtonText}>
                  ✕
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{chat.name[0]}</Text>
              </View>

              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>{chat.name}</Text>
                <Text style={styles.headerStatus}>
                  {!isRealtimeConnected
                    ? 'offline'
                    : !isCompanionOnline
                      ? formatLastSeen(companionLastSeenAt)
                      : isCompanionTyping
                        ? 'печатает...'
                        : 'online'}
                </Text>
              </View>

              <Pressable
                onPress={handleOpenSearch}
                style={({ pressed }) => [
                  styles.searchButton,
                  pressed && styles.searchButtonPressed,
                ]}
              >
                <Text style={styles.searchButtonText}>
                  🔍
                </Text>
              </Pressable>
              
              <Pressable style={({ pressed }) => [styles.callButton,
              pressed && styles.callButtonPressed,]}>
                <Text style={styles.callButtonText}>📞</Text>
              </Pressable>
            </>
          )}  
        </View>

        {isSearchMode && (
          <View style={styles.searchStatus}>
            <Text style={styles.searchStatusText}>
              {!messageSearchText.trim()
                ? 'Введите текст для поиска'
                : isSearchingMessages || isSearchPending
                  ? 'Поиск...'
                  : messageSearchError
                    ? messageSearchError
                    : messageSearchResults.length === 0
                      ? 'Сообщения не найдены'
                      : `Найдено: ${messageSearchResults.length}`}
            </Text>
          </View>
        )}
      
        <FlatList
          ref={listRef}
          style={[
            styles.messages,
            !isSearchMode &&
              !isInitialMessagePositionReady &&
              styles.messagesPreparing,
          ]}
          data={displayedMessages}
          maintainVisibleContentPosition={
            isSearchMode
              ? undefined
              : {
                minIndexForVisible: 0,
              }
          }
          onContentSizeChange={() => {
            if (
              isSearchMode ||
              messageList.length === 0 ||
              hasInitialScrollCompletedRef.current ||
              isInitialScrollScheduledRef.current
            ) {
              return;
            }

            isInitialScrollScheduledRef.current = true;

            setTimeout(() => {
              listRef.current?.scrollToEnd({
                animated: false,
              });

              if (!hasInitialScrollCompletedRef.current) {
                hasInitialScrollCompletedRef.current = true;

                setIsInitialMessagePositionReady(true);
              }

              isInitialScrollScheduledRef.current = false;
            }, 300);
          }}
          onScroll={(event) => {
            const {
              contentOffset,
              layoutMeasurement,
              contentSize,
            } = event.nativeEvent;

            handleMessagesScroll(
              contentOffset.y,
              layoutMeasurement.height,
              contentSize.height,
            );
          }}
          scrollEventThrottle={16}
          keyExtractor={(message) => message.id.toString()}
          renderItem={({ item, index }) => {
            const previousMessage = displayedMessages[index - 1];

            const messageReceipt =
              receipts.find(
                (receipt) =>
                  receipt.messageId === item.id,
              );

            const isDelivered =
              messageReceipt?.deliveredAt !== null &&
              messageReceipt?.deliveredAt !== undefined;

            const isRead =
              messageReceipt?.readAt !== null &&
              messageReceipt?.readAt !== undefined;

            const repliedMessage = 
            item.replyToMessageId !== null
              ? messages.find(
                (message) =>
                  message.id === item.replyToMessageId,
              )
              : undefined;

            const hasReply =
              item.replyToMessageId !== null;

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
                  sendStatus={item.sendStatus}
                  onRetry={
                    item.sendStatus === 'failed' &&
                    item.clientMessageId
                      ? () => {
                        void retryMessage(
                          item.clientMessageId,
                        );
                      }
                      : undefined
                  }
                  replyAuthor={
                    hasReply
                      ? repliedMessage?.author ?? 'Ответ'
                      : undefined
                  }
                  replyText={
                    hasReply
                      ? repliedMessage?.text ??
                        'Исходное сообщение недоступно'
                      : undefined
                  }
                  replyDeleted={
                    repliedMessage
                      ? repliedMessage.deletedAt !== null
                      : false
                  }
                  forwardedFromAuthor={
                    item.forwardedFromAuthor
                  }
                  isDelivered={isDelivered}
                  isRead={isRead}
                  onLongPress={
                    item.sendStatus === null &&
                    item.deletedAt === null
                      ? () => handleOpenMessageMenu(item)
                      : undefined                  
                  }
                />
              </View>
            )
          }}
        />

        <Modal
          visible={isMessageMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={
            handleCloseMessageMenu
          }
        >
          <View style={styles.messageMenuRoot}>
            <Pressable
              style={styles.messageMenuBackdrop}
              onPress={handleCloseMessageMenu}
            />

            <View style={styles.messageMenu}>
              <Pressable
                style={styles.messageMenuItem}
                onPress={() => {
                  if (!selectedMessage) {
                    return;
                  }

                  handleStartReply(
                    selectedMessage,
                  );
                }}
              >
                <Text style={styles.messageMenuText}>
                  Ответить
                </Text>
              </Pressable>

              <Pressable
                style={styles.messageMenuItem}
                onPress={() => {
                  if (!selectedMessage) {
                    return;
                  }

                  handleStartForward(
                    selectedMessage.id,
                  );
                }}
                >
                  <Text style={styles.messageMenuText}>
                    Переслать
                  </Text>
                </Pressable>

              {selectedMessage?.isOwn &&(
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

                    handleCloseMessageMenu();
                  }}
                >
                  <Text style={styles.messageMenuText}>
                    Редактировать
                  </Text>
                </Pressable>
              )}
              
              <Pressable
                style={styles.messageMenuItem}
                onPress={async () => {
                  if (!selectedMessage) {
                    return;
                  }

                  const messageId = selectedMessage.id;

                  handleCloseMessageMenu();

                  await deleteMessageForMe(messageId);
                }}
              >
                <Text style={styles.deleteMessageMenuText}>
                  Удалить у меня
                </Text>
              </Pressable>
              
              {selectedMessage?.isOwn &&(
                <Pressable
                  style={styles.messageMenuItem}
                  onPress={async () => {
                    if (!selectedMessage) {
                      return;
                    }

                    const messageId =
                      selectedMessage.id;

                    handleCloseMessageMenu();

                    await deleteMessage(messageId);
                  }}
                >
                  <Text style={styles.deleteMessageMenuText}>
                    Удалить у всех
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </Modal>
        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}

        {!isSearchMode && (
          <>
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

            {replyingMessage !== null &&(
              <View style={styles.replyingBar}>
                <View style={styles.replyingInfo}>
                  <Text style={styles.replyingTitle}>
                    Ответ: {replyingMessage.author}
                  </Text>

                  <Text
                    style={styles.replyingText}
                    numberOfLines={1}
                  >
                    {replyingMessage.text}
                  </Text>
                </View>

                <Pressable
                  onPress={handleCancelReply}
                  style={styles.cancelReplyButton}
                >
                  <Text style={styles.cancelReplyButtonText}>
                    ✕
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput 
                  value={text}
                  onChangeText={handleTextChange}
                  placeholder="Написать сообщение..."
                  placeholderTextColor='gray'
                  style={styles.input}
                  multiline
                />
                <Pressable
                  style={styles.attachmentButton}
                  onPress={handlePickAttachment}
                >
                  <Text>📎</Text>
                </Pressable>
              </View>
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
                  {isEditing
                    ? '...' 
                    : editingMessageId !== null
                      ? 'Save'
                      : 'Send'}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


