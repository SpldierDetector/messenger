import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MessagesProvider } from '@/providers/messages-provider';
import { connectWebSocket } from '@/services/websocket-service';


export default function TabLayout() {
  useEffect(() => {
    const socket = connectWebSocket();

    return () => {
      socket.close();
    };
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
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
    </ThemeProvider>
  );
}
