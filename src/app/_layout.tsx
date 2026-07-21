import { DarkTheme, Stack, ThemeProvider } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MessagesProvider } from '@/providers/messages-provider';


export default function TabLayout() {

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
