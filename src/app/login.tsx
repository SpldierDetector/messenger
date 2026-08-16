import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/auth-provider';
import { styles } from '@/styles/login.styles';

export default function loginScreen() {
  const { login } = useAuth();

  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!loginValue.trim() || !password) {
      setError('Введите логин и пароль');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await login({
        login: loginValue,
        password,
      });

      router.replace('/');
    } catch (caughtError) {
      console.error('Login failed:', caughtError);

      setError('Неверный логин или пароль');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voxa</Text>

      <Text style={styles.subtitle}>
        Войдите в аккаунт
      </Text>

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

      {error ? (
        <Text style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Pressable
        onPress={handleLogin}
        disabled={isSubmitting}
        style={styles.button}
      >
        {isSubmitting ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>
            Войти
          </Text>
        )}
      </Pressable>
    </View>
  );
}