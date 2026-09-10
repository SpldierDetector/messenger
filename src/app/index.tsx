import { Redirect, router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/styles/index.styles';

import { ChatPreview } from '@/components/chat-preview';
import { useAuth } from '@/providers/auth-provider';
import { useMessages } from '@/providers/messages-provider';
import {
  deleteChatRequest,
  deleteChatWithHistoryRequest,
  getChatsRequest
} from '@/services/chat-api';
import type { ChatData } from '@/types/chat';
import { sortChatsByLatestMessage } from '@/utils/chat';
import { formatChatPreviewDate } from '@/utils/date';
import { getLastMessage } from '@/utils/message';

type ChatDeleteMode = | 'hide' | 'with-history';

export default function ChatListScreen() {
  const [chats, setChats] = useState<ChatData[]>([]);
  const [menuChat, setMenuChat] = useState<ChatData | null>(null);
  const [chatToDelete, setChatToDelete] = useState<ChatData | null>(null);
  const [chatDeleteMode, setChatDeleteMode] = useState<ChatDeleteMode>('hide');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);


  const { 
    isAuthenticated, 
    isAuthLoading, 
    logout,
    token,
  } = useAuth();

  const { 
    messages, 
    unreadCounts,
    typingUserIdsByChat,
    onlineByChat,
    clearChatHistoryLocally,
    loadLatestMessagePreviews, 
  } = useMessages();

  useFocusEffect(
    useCallback(() => {
      if (
        isAuthLoading ||
        !isAuthenticated ||
        !token
      ) {
        return;
      }

      let isActive = true;

      loadLatestMessagePreviews();

      getChatsRequest(token)
        .then((loadedChats) => {
          if (!isActive) {
            return;
          }

          setChats(loadedChats);
        })
        .catch((error) => {
          console.error(
            'Failed to load chats:',
            error,
          );
        });

        return() => {
          isActive = false;
        };
    }, [
      isAuthLoading,
      isAuthenticated,
      token,
    ]),
  );

  useEffect(() => {
    if (
      !isAuthenticated ||
      !token
    ) {
      return;
    }

    const hasUnknownChat = messages.some(
      (message) =>
        !chats.some(
          (chat) =>
            chat.id === message.chatId,
        )
    );

    if (!hasUnknownChat) {
      return;
    }

    getChatsRequest(token)
      .then((loadedChats) => {
        setChats(loadedChats);
      })
      .catch((error) => {
        console.error(
          'Failed to refresh chats:',
          error,
        );
      });
  }, [
    messages,
    chats,
    isAuthenticated,
    token,
  ]);

  

  if (isAuthLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const sortedChats = sortChatsByLatestMessage(chats, messages);
  
  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  function handleDeleteMenuPress(mode: ChatDeleteMode) {
    if (!menuChat) {
      return;
    }

    setDeleteError(null);
    setChatToDelete(menuChat);
    setChatDeleteMode(mode);
    setMenuChat(null);
  }

  async function handleConfirmDelete() {
    if (
      !chatToDelete ||
      !token
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      if (
        chatDeleteMode ===
        'with-history'
      ) {
        await deleteChatWithHistoryRequest(
          chatToDelete.id,
          token,
        );

        clearChatHistoryLocally(
          chatToDelete.id,
        );
      } else {
        await deleteChatRequest(
          chatToDelete.id,
          token,
        );
      }

      setChats((currentChats) =>
        currentChats.filter(
          (chat) =>
            chat.id !== chatToDelete.id,
        ),
      );

      setChatToDelete(null);
    } catch (error) {
      console.error(
        'Failed to delete chat:',
        error,
      );

      setDeleteError(
        chatDeleteMode ===
          'with-history'
          ? 'Не удалось удалить чат с историей'
          : 'Не удалось удалить чат',
      );
    } finally {
      setIsDeleting(false);
    }
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voxa</Text>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              router.push('/new-chat' as Href);
            }}
            style={({ pressed }) => [
              styles.newChatButton,
              pressed && styles.newChatButtonPressed,
            ]}
          >
            <Text style={styles.newChatButtonText}>+</Text>
          </Pressable>

          <Pressable 
            onPress={handleLogout}
            style={({ pressed}) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
          >
            <Text style={styles.logoutButtonText}>Выйти</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={sortedChats}
        keyExtractor={(chat) => chat.id.toString()}
        renderItem={({ item }) => {
          const lastMessage = getLastMessage(messages, item.id);
          const realtimeIsOnline = onlineByChat[item.id];
          const isOnline = realtimeIsOnline ?? item.isOnline;
          const isTyping = (typingUserIdsByChat[item.id]?.length ?? 0) > 0;

          const unreadCount = unreadCounts.find(
            (count) => count.chatId === item.id,
          )?.unreadCount ?? 0;

          return (
            <View style={styles.chatRow}>
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
                  lastMessage={lastMessage?.text ?? 'Нет сообщений'}
                  time={lastMessage ? formatChatPreviewDate(lastMessage.createdAt) : ''}
                  isOnline={isOnline}
                  isTyping={isTyping}
                  unreadCount={unreadCount}
                />
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setMenuChat(item);
                }}
                style={({ pressed }) => [
                  styles.chatMenuButton,
                  pressed &&
                  styles.chatMenuButtonPressed,
                ]}
              >
                <Text style={styles.chatMenuButtonText}>
                  ⋮
                </Text>
              </Pressable>
            </View>
          );
        }}
      />

      <Modal
        transparent
        animationType="fade"
        visible={menuChat !== null}
        onRequestClose={() => {
          setMenuChat(null);
        }}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setMenuChat(null);
            }}
          />

          <View style={styles.contextMenu}>
            <Text
              style={
                styles.contextMenuTitle
              }
            >
              {menuChat?.name}
            </Text>

            <Pressable
              onPress={() => {
                handleDeleteMenuPress('hide')
              }}
              style={({ pressed }) => [
                styles.contextMenuItem,
                pressed &&
                  styles.contextMenuItemPressed,
              ]}
            >
              <Text
                style={
                  styles.deleteMenuText
                }
              >
                Удалить чат
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                handleDeleteMenuPress('with-history');
              }}
              style={({ pressed }) => [
                styles.contextMenuItem,
                pressed &&
                  styles.contextMenuItemPressed,
              ]}
            >
              <Text
                style={
                  styles.deleteMenuText
                }
              >
                Удалить чат с историей
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={chatToDelete !== null}
        onRequestClose={() => {
          if (!isDeleting) {
            setChatToDelete(null);
          }
        }}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            disabled={isDeleting}
            onPress={() => {
              setChatToDelete(null);
            }}
          />

          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>
              {chatDeleteMode === 'with-history'
                ? 'Удалить чат с историей'
                : 'Удалить чат?'}
            </Text>

            <Text
              style={
                styles.confirmDescription
              }
            >
              {chatDeleteMode === 'with-history' ? (
                <>
                  Чат с {chatToDelete?.name}
                  {' '}исчезнет из вашего списка.
                  История сообщений будет удалена
                  только у вас и не восстановится
                  при повторном открытии чата.
                  У собеседника история сохранится.
                </>
              ) : (
                <>
                  Чат с {chatToDelete?.name}
                  {' '}исчезнет из вашего списка.
                  История сообщений сохранится.
                </>
              )}
            </Text>

            {deleteError ? (
              <Text
                style={
                  styles.deleteError
                }
              >
                {deleteError}
              </Text>
            ) : null}

            <View
              style={
                styles.confirmActions
              }
            >
              <Pressable
                disabled={isDeleting}
                onPress={() => {
                  setChatToDelete(null);
                }}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed &&
                    styles.dialogButtonPressed,
                ]}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Отмена
                </Text>
              </Pressable>

              <Pressable
                disabled={isDeleting}
                onPress={
                  handleConfirmDelete
                }
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed &&
                    styles.dialogButtonPressed,
                ]}
              >
                {isDeleting ? (
                  <ActivityIndicator />
                ) : (
                  <Text
                    style={
                      styles.deleteButtonText
                    }
                  >
                    Удалить
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
  
}

