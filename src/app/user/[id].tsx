import { 
  useCallback,
  useEffect,
  useState, 
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useMessages } from '@/providers/messages-provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Redirect,
  router,
  useFocusEffect,
  useLocalSearchParams,
  type Href,
} from 'expo-router';

import { UserAvatar } from '@/components/user-avatar';
import { AvatarViewer } from '@/components/avatar-viewer';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-error';
import { createDirectChatRequest } from '@/services/chat-api';
import { getUserByIdRequest } from '@/services/user-api';
import { styles } from '@/styles/user-profile.styles';
import type { UserData } from '@/types/user';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const {
    token,
    user: currentUser,
    isAuthenticated,
    isAuthLoading,
  } = useAuth();

  const userId = Number(id);
  const { profileRevision } = useMessages();

  const isValidUserId =
    Number.isSafeInteger(userId) &&
    userId > 0;

  const [profile, setProfile] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvatarViewerVisible, setIsAvatarViewerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!token || !isValidUserId) {
        setProfile(null);
        setIsLoading(false);

        if (!isValidUserId) {
          setError('Некорректный ID пользователя');
        }

        return;
      }

      let isActive = true;

      setIsLoading(true);
      setError(null);
      setProfile(null);

      void getUserByIdRequest(userId, token)
        .then((loadedProfile) => {
          if (!isActive) return;

          setProfile(loadedProfile);
        })
        .catch((caughtError) => {
          if (!isActive) return;

          console.error(
            'Failed to load user profile:',
            caughtError,
          );

          if (
            caughtError instanceof ApiError &&
            caughtError.status === 404
          ) {
            setError('Пользователь не найден');
          } else {
            setError (
              'Не удалось загрузить профиль',
            );
          }
        })
        .finally(() => {
          if (isActive) {
            setIsLoading(false);
          }
        });

      return () => {
        isActive = false;
      };
    }, [token, userId, isValidUserId]),
  );

  useEffect(() => {
    if (
      profileRevision === 0 ||
      !token ||
      !isValidUserId
    ) {
      return;
    }

    let isActive = true;

    void getUserByIdRequest(userId, token)
      .then((updatedProfile) => {
        if (!isActive) return;

        setProfile((currentProfile) => {
          if (
            !currentProfile ||
            currentProfile.id !== updatedProfile.id
          ) {
            return currentProfile;
          }

          return updatedProfile;
        });
      })
      .catch((error) => {
        console.warn(
          'Failed to refresh public profile:',
          error,
        );
      });

    return () => {
      isActive = false;
    };
  }, [
    profileRevision,
    token,
    userId,
    isValidUserId,
  ]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function handleOpenChat() {
    if (
      !token ||
      !profile ||
      isOpeningChat ||
      profile.id === currentUser?.id
    ) {
      return;
    }

    try{
      setIsOpeningChat(true);
      setError(null);

      const chat = await createDirectChatRequest(
        profile.id,
        token,
      );

      router.push(
        `/chat/${chat.id}` as Href,
      );
    } catch (caughtError) {
      console.error(
        'Failed to open chat from profile:',
        caughtError,
      );

      setError(
        'Не удалось открыть переписку',
      );
    } finally {
      setIsOpeningChat(false);
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
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            ← Назад
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Профиль пользователя
        </Text>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#8ab4f8"
            style={styles.loader}
          />
        ) : profile ? (
          <>
            <View style={styles.profileSection}>
              <Pressable
                onPress={() => setIsAvatarViewerVisible(true)}
                disabled={!profile.avatarUrl}
                accessibilityRole="button"
                accessibilityLabel={`Просмотреть фотографию ${profile.name}`}
              >
                <UserAvatar
                  name={profile.name}
                  avatarUrl={profile.avatarUrl}
                  size={104}
                />
              </Pressable>

              <Text style={styles.userName}>
                {profile.name}
              </Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.label}>
                О себе
              </Text>

              <Text style={styles.bio}>
                {profile.bio ||
                  'Пользователь пока ничего о себе не рассказал'}
              </Text>
            </View>

            {profile.id !== currentUser?.id ? (
              <Pressable
                onPress={handleOpenChat}
                disabled={isOpeningChat}
                accessibilityRole="button"
                style={({ pressed }) => [
                  (pressed || isOpeningChat) &&
                    styles.messageButtonPressed,
                ]}
              >
                {isOpeningChat ? (
                  <ActivityIndicator
                    color="#ffffff"
                  />
                ) : (
                  <Text style={styles.messageButtonText}>
                    Написать сообщение
                  </Text>
                )}
              </Pressable>
            ) : null}
          </>
        ) : null}

        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        <AvatarViewer
          visible={isAvatarViewerVisible}
          avatarUrl={profile?.avatarFullUrl ?? profile?.avatarUrl}
          onClose={() => setIsAvatarViewerVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}