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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    color: '#AAAAAA',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },

  input: {
    backgroundColor: '#161616',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  
  error: {
    color: '#FF6B6B',
    marginBottom: 12,
  },

  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});