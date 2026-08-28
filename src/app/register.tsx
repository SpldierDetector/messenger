import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';
import { styles } from '@/styles/register.styles';
import { ApiError } from '@/services/api-error';

export default function RegisterScreen() {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    const normalizedName = name.trim();
    const normalizedLogin = loginValue.trim();

    if (
      !normalizedName ||
      !normalizedLogin ||
      !password ||
      !passwordRepeat
    ) {
      setError('Заполните все поля');
      return;
    }

    if (
      normalizedLogin.length < 3 ||
      normalizedLogin.length > 32
    ) {
      setError(
        'Логин должен содержать от 3 до 32 символов',
      );
      return;
    }

    if (
      password.length < 8 ||
      password.length > 128
    ) {
      setError(
        'Пароль должен содержать от 8 до 128 символов',
      );
      return;
    }

    if (password !== passwordRepeat) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await register({
        name: normalizedName,
        login: normalizedLogin,
        password,
      });

      router.replace('/');
    } catch (caughtError) {
      if (
        caughtError instanceof ApiError &&
        caughtError.status === 409
      ) {
        setError('Этот логин уже занят');
      } else {
        console.error(
          'Registration failed:',
          caughtError,
        );

        setError(
          'Не удалось зарегистрироваться',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Voxa
      </Text>

      <Text style={styles.subtitle}>
        Создайте аккаунт
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Имя"
        placeholderTextColor="#777777"
        autoCorrect={false}
        style={styles.input}
      />

      <TextInput
        value={loginValue}
        onChangeText={setLoginValue}
        placeholder="Логин"
        placeholderTextColor="#777777"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      <TextInput 
        value={password}
        onChangeText={setPassword}
        placeholder="Пароль"
        placeholderTextColor="#777777"
        secureTextEntry
        style={styles.input}
      />

      <TextInput 
        value={passwordRepeat}
        onChangeText={setPasswordRepeat}
        placeholder="Повторите пароль"
        placeholderTextColor="#777777"
        secureTextEntry
        style={styles.input}
      />

      {error ?(
        <Text style={styles.error}>
          {error}
        </Text>
      ): null}

      <Pressable
        onPress={handleRegister}
        disabled={isSubmitting}
        style={styles.button}
      >
        {isSubmitting ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>
            Зарегистрироваться
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => router.replace('/login')}
        disabled={isSubmitting}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>
          Уже есть аккаунт? Войти
        </Text>
      </Pressable>
    </View>
  );
}