import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MessagesProvider } from '@/providers/messages-provider';


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MessagesProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{headerShown: false}}/>
      </MessagesProvider>
    </ThemeProvider>
  );
}
