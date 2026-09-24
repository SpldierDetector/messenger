import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  Platform,
  Text,
  View,
} from 'react-native'
import type { File } from 'expo-file-system';
import { 
  loadAttachmentImageNative,
  loadAttachmentImageWeb 
} from '@/services/attachments-service';
import { styles } from '@/styles/message.styles';
import type { AttachmentData } from '@/types/message';

type AttachmentImageProps = {
  chatId: number;
  attachment: AttachmentData;
  token: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function AttachmentImage({
  chatId,
  attachment,
  token,
  onPress,
  disabled = false,
}: AttachmentImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    let objectUrl: string | null = null;
    let cachedFile: File | null = null;

    setImageUrl(null);
    setLoadError(false);
    setIsPreviewVisible(false);

    async function loadImage() {
      try {
        if (Platform.OS === 'web'){
          const url = await loadAttachmentImageWeb(
            chatId,
            attachment,
            token,
          );

          if (!isActive) {
            URL.revokeObjectURL(url);
            return;
          }

          objectUrl = url;
          setImageUrl(url);
          } else {
          const file = await loadAttachmentImageNative(
            chatId,
            attachment,
            token,
          );

          if (!isActive) {
            file.delete();
            return;
          }

          cachedFile = file;
          setImageUrl(file.uri);
        }
      }  catch (error) {
        console.error(
          'Failed to load attachment image:',
          error,
        );

        if (isActive) {
          setLoadError(true);
        }
      }
    }

    void loadImage();

    return () => {
      isActive = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      if (cachedFile) {
        cachedFile.delete();
      }
    };
  }, [chatId, attachment.id, token, reloadKey]);

  return (
    <>
      <Pressable
        style={styles.attachmentImage}
        onPress={() => {
          if (loadError) {
            setReloadKey((current) => current + 1);
            return;
          }

          if (imageUrl) {
            setIsPreviewVisible(true)
          }
        }}
        disabled={disabled || (!imageUrl && !loadError)}
      >
        {imageUrl && !loadError ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.attachmentImagePreview}
            resizeMode="cover"
            onError={() => setLoadError(true)}
          />
        ) : (
          <Text style={styles.attachmentImagePlaceholder}>
            {loadError
              ? 'Не удалось загрузить фото'
              : 'Загрузка фото...'}
          </Text>
        )}
      </Pressable>

      <Modal
        visible={isPreviewVisible && !!imageUrl && !loadError}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPreviewVisible(false)}
      >
        <View style={styles.imageViewer}>
          <View style={styles.imageViewerHeader}>
            <Pressable
              onPress={() => setIsPreviewVisible(false)}
              style={styles.imageViewerButton}
            >
              <Text style={styles.imageViewerButtonText}>
                ✕ Закрыть
              </Text>
            </Pressable>

            <Pressable
              onPress={onPress}
              disabled={disabled || !onPress}
              style={styles.imageViewerButton}
            >
              <Text style={styles.imageViewerButtonText}>
                Скачать
              </Text>
            </Pressable>
          </View>

          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.imageViewerPhoto}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
}