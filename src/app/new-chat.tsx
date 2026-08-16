import { Redirect, router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/auth-provider';
import { createDirectChatRequest } from '@/services/chat-api';
import { searchUsersRequest } from '@/services/user-api';
import { styles } from '@/styles/new-chat.styles'
import type { UserData } from '@/types/user';

export default function NewChatScreen() {
  const {
    token,
    isAuthenticated,
    isAuthLoading,
  } = useAuth();

  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [openingUserId, setOpeningUserId] =
    useState<number | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  
  useEffect(() => {
    const query = search.trim();

    if (!token || !query) {
      setUsers([]);
      setIsSearching(false);
      setError(null);

      return;
    }

    let isCancelled = false;

    setIsSearching(true);

    const timeoutId = setTimeout(
      async () => {
        try {
          setError(null);

          const loadedUsers =
            await searchUsersRequest(
              query,
              token,
            );
          if (!isCancelled) {
            setUsers(loadedUsers);
          }
        } catch (caughtError) {
          if (isCancelled) {
            return;
          }

          console.error(
            'Failed to search users:',
            caughtError,
          );

          setError(
            'Не удалось выполнить поиск',
          );
        } finally {
          if(!isCancelled) {
            setIsSearching(false);
          }
        }
      },
      500,
    );

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [search, token]);

  async function handleUserPress(
    user:UserData,
  ) {
    if (!token) {
      return;
    }

    try {
      setOpeningUserId(user.id);
      setError(null);

      const chat =
        await createDirectChatRequest(
          user.id,
          token,
        );
      
      router.replace(
        `/chat/${chat.id}` as Href,
      );
    } catch (caughtError) {
      console.error(
        'Failed to open direct chat:',
        caughtError,
      );

      setError(
        'Не удалось открыть чат',
      );
    } finally {
      setOpeningUserId(null);
    }
  }

  if (isAuthLoading) {
    return null;
  }

  if (!isAuthenticated || !token) {
    return <Redirect href="/login" />
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.backButtonText}>
            ←
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Новый чат
        </Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Имя или логин"
          placeholderTextColor="#777777"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

          {isSearching ? (
            <ActivityIndicator />
          ) : null}
      </View>

      {error ? (
        <Text style={styles.error}>
          {error}
        </Text>
      ) : null}

      <FlatList
        data={users}
        keyExtractor={(user) =>
          user.id.toString()
        }
        ListEmptyComponent={
          search.trim() && !isSearching ? (
            <Text style={styles.emptyText}>
              Пользователи не найдены
            </Text>
          ) : null
        }
        renderItem={({  item }) => {
          const isOpening = openingUserId === item.id;

          return (
            <Pressable
              onPress={() =>
                handleUserPress(item)
              }
              disabled={isOpening}
              style={({ pressed }) => [
                styles.userItem,
                pressed && styles.userItemPressed,
              ]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name[0]}
                </Text>
              </View>

              <Text style={styles.userName}>
                {item.name}
              </Text>

              {isOpening ? (
                <ActivityIndicator />
              ) : null}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}