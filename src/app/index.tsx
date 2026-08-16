import { router, type Href, Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/styles/index.styles';

import { ChatPreview } from '@/components/chat-preview';
import { useMessages } from '@/providers/messages-provider';
import { deleteChatRequest, getChatsRequest } from '@/services/chat-api';
import type { ChatData } from '@/types/chat';
import { sortChatsByLatestMessage } from '@/utils/chat';
import { formatChatPreviewDate } from '@/utils/date';
import { getLastMessage } from '@/utils/message';
import { useAuth } from '@/providers/auth-provider';


export default function ChatListScreen() {
  const [chats, setChats] = useState<ChatData[]>([]);
  const [menuChat, setMenuChat] = 
    useState<ChatData | null>(null);
  const [chatToDelete, setChatToDelete] =
    useState<ChatData | null>(null);
  const [isDeleting, setIsDeleting] =
    useState(false);
  const [deleteError, setDeleteError] =
    useState<string | null>(null);


  const { 
    isAuthenticated, 
    isAuthLoading, 
    logout,
    token,
  } = useAuth();

  const { 
    messages, 
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

  function handleDeleteMenuPress() {
    if (!menuChat) {
      return;
    }

    setDeleteError(null);
    setChatToDelete(menuChat);
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

      await deleteChatRequest(
        chatToDelete.id,
        token,
      );

      setChats((currentChats) => currentChats.filter(
        (chat) =>
          chat.id !== chatToDelete.id,
      ));

      setChatToDelete(null);
    } catch (error) {
      console.error(
        'Failed to delete chat:',
        error,
      );

      setDeleteError(
        'Не удалось удалить чат',
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
                  isOnline={item.isOnline}
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
              onPress={
                handleDeleteMenuPress
              }
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
            <Text
              style={
                styles.confirmTitle
              }
            >
              Удалить чат?
            </Text>

            <Text
              style={
                styles.confirmDescription
              }
            >
              Чат с {chatToDelete?.name}
              {' '}исчезнет из вашего списка.
              История сообщений сохранится.
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

