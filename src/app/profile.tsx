import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-error';
import { styles } from '@/styles/profile.styles';
import { UserAvatar } from '@/components/user-avatar';

export default function ProfileScreen() {
  const {
    user,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    logout,
  } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    setName(user?.name ?? '');
    setBio(user?.bio ?? '');
    setError(null);
    setSuccess(null);
  }, [user?.id]);

  const hasChanges =
    name !== (user?.name ?? '') ||
    bio !== (user?.bio ?? '');

  function handleNameChange(value: string) {
    setName(value);
    setError(null);
    setSuccess(null);
  }

  function handleBioChange(value: string) {
    setBio(value);
    setError(null);
    setSuccess(null);
  }

  async function handleChooseAvatar() {
    if (
      !user ||
      isSaving ||
      isUpdatingAvatar
    ) {
      return;
    }

    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: [
            'image/jpeg',
            'image/png',
            'image/webp',
          ],
          multiple: false,
          copyToCacheDirectory: true,
        });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset) {
        return;
      }

      if (
        typeof asset.size === 'number' &&
        asset.size > 5 * 1024 * 1024
      ) {
        setError (
          'Размер фотографии не должен превышать 5 МБ',
        );

        return;
      }

      setIsUpdatingAvatar(true);
      setError(null);
      setSuccess(null);

      await uploadAvatar(asset);

      setSuccess('Фотография обновлена');
    } catch (caughtError) {
      console.error(
        'Avatar upload failed:',
        caughtError,
      );

      if (
        caughtError instanceof ApiError &&
        caughtError.status === 413
      ) {
        setError('Фотография слишком большая');
      } else if (
        caughtError instanceof ApiError &&
        caughtError.status === 415
      ) {
        setError('Неподдерживаемый формат фотографии');
      } else {
        setError('Не удалось загрузить фотографию');
      }
    } finally {
      setIsUpdatingAvatar(false);
    }
  }

  async function handleDeleteAvatar() {
    if (
      !user?.avatarUrl ||
      isSaving ||
      isUpdatingAvatar
    ) {
      return;
    }

    try {
      setIsUpdatingAvatar(true);
      setError(null);
      setSuccess(null);

      await deleteAvatar();

      setSuccess('Фотография удалена');
    } catch (caughtError) {
      console.error(
        'Avatar deletion failed:',
        caughtError,
      );

      setError('Не удалось удалить фотографию');
    } finally {
      setIsUpdatingAvatar(false);
    }
  }

  async function handleSave() {
    if (!user || isSaving) return;

    const normalizedName = name.trim();
    const normalizedBio = bio.trim();

    if (
      normalizedName.length < 1 ||
      normalizedName.length > 64
    ) {
      setError(
        'Имя должно содержать от 1 до 64 символов',
      );

      return;
    }

    if (normalizedBio.length > 300) {
      setError(
        'Описание не должно превышать 300 символов',
      );

      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const updatedUser = await updateProfile({
        name: normalizedName,
        bio: normalizedBio || null,
      });

      setName(updatedUser.name);
      setBio(updatedUser.bio ?? '');

      setSuccess('Профиль сохранён');
    } catch (caughtError) {
      if (
        caughtError instanceof ApiError &&
        caughtError.status === 400
      ) {
        setError('Проверьте данные профиля');
      } else if (
        caughtError instanceof ApiError &&
        caughtError.status === 401
      ) {
        setError(
          'Сессия истекла. Войдите в аккаунт повторно',
        );
      } else {
        console.error(
          'Profile update failed:',
          caughtError,
        );

        setError(
          'Не удалось сохранить профиль',
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }
  
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>
          Пользователь не авторизован
        </Text>

        <Pressable
          onPress={() => router.replace('/')}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            Назад
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        onPress={() => router.replace('/')}
        style={styles.backButton}
      >
        <Text style={styles.backText}>
          ← Назад
        </Text>
      </Pressable>

      <Text style={styles.title}>
        Мой профиль
      </Text>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <UserAvatar
            name={user?.name ?? ''}
            avatarUrl={user?.avatarUrl}
            size={104}
          />
        </View> 

        <Pressable
          onPress={handleChooseAvatar}
          disabled={isUpdatingAvatar || isSaving}
          style={({ pressed }) => [
            styles.avatarAction,
            pressed && styles.avatarActionPressed,
          ]}
        >
          <Text style={styles.avatarActionText}>
            {isUpdatingAvatar
              ? 'Обработка фотографии...'
              : user.avatarUrl
                ? 'Изменить фотографию'
                : 'Установить фотографию'}
          </Text>
        </Pressable>

        {user.avatarUrl ? (
          <Pressable
            onPress={handleDeleteAvatar}
            disabled={isUpdatingAvatar || isSaving}
            style={styles.avatarDeleteAction}
          >
            <Text style={styles.avatarDeleteText}>
              Удалить фотографию
            </Text>
          </Pressable>
        ) : null}

        <Text style={styles.avatarHint}>
          JPEG, PNG или WebP, до 5 МБ
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>
          Имя
        </Text>

        <TextInput
          value={name}
          onChangeText={handleNameChange}
          placeholder="Ваше имя"
          placeholderTextColor="#777777"
          maxLength={64}
          style={styles.input}
        />

        <Text style={styles.label}>
          О себе
        </Text>

        <TextInput
          value={bio}
          onChangeText={handleBioChange}
          placeholder="Расскажите немного о себе"
          placeholderTextColor="#777777"
          maxLength={300}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={[
            styles.input,
            styles.bioInput,
          ]}
        />

        <Text style={styles.counter}>
          {bio.length} / 300
        </Text>

        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        {success ? (
          <Text style={styles.success}>
            {success}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSave}
          disabled={isSaving || !hasChanges}
          style={[
            styles.saveButton,
            (isSaving || !hasChanges) && 
              styles.saveButtonDisabled,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              Сохранить
            </Text>
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={handleLogout}
        disabled={isSaving}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed,
        ]}
      >
        <Text style={styles.logoutButtonText}>
          Выйти из аккаунта
        </Text>
      </Pressable>
    </ScrollView>
  );
}
