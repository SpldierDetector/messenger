import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type { File } from 'expo-file-system';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import {
  loadAttachmentAudioNative,
  loadAttachmentAudioWeb,
} from '@/services/attachments-service';
import { styles } from '@/styles/message.styles';
import type { AttachmentData } from '@/types/message';

type AttachmentAudioProps = {
  chatId: number;
  attachment: AttachmentData;
  token: string;
};

function formatDuration(
  seconds: number,
) {
  const totalSeconds = Math.max(
    0,
    Math.floor(seconds),
  );

  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const remainingSeconds =
    totalSeconds % 60;

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, '0')
  }`;
}

export function AttachmentAudio({
  chatId,
  attachment,
  token,
}: AttachmentAudioProps) {
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  const player = useAudioPlayer(
    null,
    {
      updateInterval: 250,
    },
  );

  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    let isActive = true;
    let objectUrl: string | null = null;
    let cachedFile: File | null = null;

    setAudioUri(null);
    setLoadError(false);

    async function loadAudio() {
      try {
        if (Platform.OS === 'web') {
          const uri =
            await loadAttachmentAudioWeb(
              chatId,
              attachment,
              token,
            );
          
          if (!isActive) {
            URL.revokeObjectURL(uri);
            return;
          }

          objectUrl = uri;
          setAudioUri(uri);

          return;
        }

        const file =
          await loadAttachmentAudioNative(
            chatId,
            attachment,
            token,
          );

        if (!isActive) {
          file.delete();
          return;
        }

        cachedFile = file;
        setAudioUri(file.uri);
      } catch (error) {
        console.error(
          'Failed to load attachment audio:',
          error,
        );

        if (isActive) {
          setLoadError(true);
        }
      }
    }

    void loadAudio();

    return () => {
      isActive = false;

      player.pause();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      if (cachedFile) {
        cachedFile.delete();
      }
    };
  }, [
    chatId,
    attachment.id,
    token,
    player,
  ]);

  useEffect(() => {
    if (!audioUri) {
      return;
    }

    player.pause();

    player.replace({
      uri: audioUri,
    });
  },[
    audioUri,
    player,
  ]);

  async function handlePlayPress() {
    if (
      !audioUri ||
      !status.isLoaded ||
      loadError
    ) {
      return;
    }

    try {
      if (status.playing) {
        player.pause();
        return;
      }

      if (
        status.didJustFinish ||
        (
          status.duration > 0 &&
          status.currentTime >= status.duration
        )
      ) {
        await player.seekTo(0);
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
        interruptionMode: 'doNotMix',
      });

      player.play();
    } catch (error) {
      console.error(
        'Failed to play attachment audio:',
        error,
      );
    }
  }

  async function handleSeekPress(
    event: GestureResponderEvent,
  ) {
    if (
      !status.isLoaded ||
      status.duration <= 0 ||
      progressWidth <= 0
    ) {
      return;
    }

    const position = Math.max(
      0,
      Math.min(
        event.nativeEvent.locationX,
        progressWidth,
      ),
    );

    const progressRatio = position / progressWidth;
    
    await player.seekTo(
      status.duration * progressRatio,
    );
  }

  const progress =
    status.duration > 0
      ? Math.min(
        1,
        status.currentTime / status.duration,
        )
      : 0;

  return (
    <View style={styles.audioAttachment}>
      <Pressable
        style={styles.audioPlayButton}
        onPress={() => {
          void handlePlayPress();
        }}
        disabled={
          !audioUri ||
          !status.isLoaded ||
          loadError
        }
      >
        <Text style={styles.audioPlayButtonText}>
          {loadError
            ? '!'
            : status.playing
              ? '⏸'
              : '▶'}
        </Text>
      </Pressable>
      <View style={styles.audioInfo}>
        <Pressable
          style={styles.audioProgressTrack}
          onLayout={(event) => {
            setProgressWidth(
              event.nativeEvent.layout.width,
            );
            }}
            onPress={(event) => {
              void handleSeekPress(event);
            }}
        >
          <View
            style={[
              styles.audioProgressFill,
              {
                width: `${progress * 100}%`,
              },
            ]}
          />
        </Pressable>

        <Text style={styles.audioDuration}>
          {loadError
            ? 'Не удалось загрузить'
            : `${formatDuration(status.currentTime)} / ${formatDuration(status.duration)}`}
        </Text>
      </View>
    </View>
  )
}