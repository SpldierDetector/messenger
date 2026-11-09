import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { PushRegistration } from '@/components/push-registration';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/providers/auth-provider';
import { MessagesProvider } from '@/providers/messages-provider';
import '@/services/chat-notifications';
import { PushNotificationNavigation } from '@/components/push-notification-navigation';

export default function TabLayout() {

  return (
    <ThemeProvider value={DarkTheme}>
      <AuthProvider>
        <MessagesProvider>
          <PushRegistration />
          <AnimatedSplashOverlay />

          <Stack screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: {
              backgroundColor: '#000000',
            },
          }}/>

          <PushNotificationNavigation />
        </MessagesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
