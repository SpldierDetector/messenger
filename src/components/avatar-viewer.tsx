import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '@/config/api';

type AvatarViewerProps = {
  visible: boolean;
  avatarUrl: string | null | undefined;
  onClose: () => void;
};

export function AvatarViewer({
  visible,
  avatarUrl,
  onClose,
}: AvatarViewerProps) {
  return (
    <Modal
      visible={visible && Boolean(avatarUrl)}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.imageContainer}>
          {avatarUrl ? (
            <Image
              source={{
                uri: `${API_BASE_URL}${avatarUrl}`,
              }}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel="Фотография профиля"
            />
          ) : null}
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть фотографию"
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
          ]}
        >
          <Text style={styles.closeButtonText}>
            ✕
          </Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  closeButton: {
    position: 'absolute',
    top: 12,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  closeButtonPressed: {
    opacity: 0.65,
  },

  closeButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '500',
  },
});