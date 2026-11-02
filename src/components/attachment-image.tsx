import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  Platform,
  Text,
  View,
  FlatList,
  useWindowDimensions,
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
  compact?: boolean;
  localUri?: string;
  galleryUris?: string[];
  galleryIndex?: number;
};

export function AttachmentImage({
  chatId,
  attachment,
  token,
  onPress,
  disabled = false,
  compact = false,
  localUri,
  galleryUris,
  galleryIndex = 0,
}: AttachmentImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const { width, height } = useWindowDimensions();
  const pageWidth = Math.max(1, width - 32);
  const pageHeight = Math.max(1, height - 110);
  const [viewerIndex, setViewerIndex] = useState(0);

  const viewerUris = galleryUris?.length
    ? galleryUris
    : imageUrl
      ? [imageUrl]
      : [];

  useEffect(() => {
    let isActive = true;
    let objectUrl: string | null = null;
    let cachedFile: File | null = null;

    setImageUrl(null);
    setLoadError(false);
    setIsPreviewVisible(false);

    if (localUri) {
      setImageUrl(localUri);
      return;
    }

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
  }, [chatId, attachment.id, token, reloadKey, localUri]);

  return (
    <>
      <Pressable
        style={[
          styles.attachmentImage,
          compact && styles.attachmentImageCompact,
        ]}
        onPress={() => {
          if (loadError) {
            setReloadKey((current) => current + 1);
            return;
          }

          if (imageUrl) {
            setViewerIndex(
              galleryUris?.length
                ? Math.max(0, galleryIndex)
                : 0,
            );
            setIsPreviewVisible(true);
          }
        }}
        disabled={disabled || (!imageUrl && !loadError)}
      >
        {imageUrl && !loadError ? (
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.attachmentImagePreview,
              compact && styles.attachmentImagePreviewCompact,
            ]}
            resizeMode="cover"
            onLoad={() => {
              if (Platform.OS === 'web') {
                console.log(
                  '[Image preview] Loaded:',
                  attachment.id,
                );
              }
            }}
            onError={(event) => {
              if (Platform.OS === 'web') {
                console.warn(
                  '[Image preview] Error:',
                  attachment.id,
                  event.nativeEvent.error,
                  'URI type:',
                  imageUrl?.split(':')[0],
                );
              }

              setLoadError(true);
            }}
          />
        ) : (
          <Text style={[
              styles.attachmentImagePlaceholder,
              compact && styles.attachmentImagePlaceholderCompact,
            ]}
          >
            {compact
              ? (loadError ? '↻' : '...')
              : (loadError
                ? 'Не удалось загрузить фото'
                : 'Загрузка фото...')}
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

          {Platform.OS === 'web' && viewerUris.length > 0 && (
            <Image
              source={{ uri: viewerUris[viewerIndex] }}
              style={{
                width: pageWidth,
                height: pageHeight,
              }}
              resizeMode="contain"
              onLoad={() => {
                console.log('[Gallery Web] Image loaded');
              }}
              onError={(event) => {
                console.warn(
                  '[Gallery Web] Image error:',
                  event.nativeEvent.error,
                );
              }}
            />
          )}

          {Platform.OS !== 'web' && viewerUris.length > 0 && (
            <FlatList
              data={viewerUris}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={[
                styles.imageViewerGallery,
              ]}
              initialScrollIndex={Math.min(
                viewerIndex,
                viewerUris.length - 1,
              )}
              keyExtractor={(_, index) => String(index)}
              getItemLayout={(_, index) => ({
                length: pageWidth,
                offset: pageWidth * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const nextIndex = Math.round(
                  event.nativeEvent.contentOffset.x / pageWidth,
                );

                setViewerIndex(
                  Math.max(
                    0,
                    Math.min(nextIndex, viewerUris.length - 1),
                  ),
                );
              }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.imageViewerSlide, 
                    { width: pageWidth },
                  ]}
                >
                  <Image
                    source={{ uri: item }}
                    style={[
                      styles.imageViewerSlideImage,
                    ]}
                    resizeMode="contain"
                  />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  );
}