import { DarkTheme, Stack, ThemeProvider } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/providers/auth-provider';
import { MessagesProvider } from '@/providers/messages-provider';

export default function TabLayout() {

  return (
    <ThemeProvider value={DarkTheme}>
      <AuthProvider>
        <MessagesProvider>
          <AnimatedSplashOverlay />

          <Stack screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: {
              backgroundColor: '#000000',
            },
          }}/>
        </MessagesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
