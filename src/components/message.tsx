import {
  Pressable,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { 
  AttachmentData,
  MessageSendStatus,
} from '@/types/message';
import { styles } from '@/styles/message.styles';
import { AttachmentImage } from '@/components/attachment-image';

type MessageProps = {
  author: string;
  text: string;
  time: string;
  isOwn: boolean;
  editedAt: number | null;
  deletedAt: number | null;
  replyAuthor?: string;
  replyText?: string;
  replyDeleted?: boolean;
  forwardedFromAuthor: string | null;
  isDelivered: boolean;
  isRead: boolean;
  sendStatus: MessageSendStatus | null;
  attachments?: AttachmentData[];
  downloadingAttachmentId?: number | null;
  chatId?: number;
  token?: string | null;
  onAttachmentPress?: (attachment: AttachmentData) => void;
  onRetry?: () => void;
  onLongPress?: () => void;
};

export function Message({
  chatId,
  token,
  author,
  text,
  time,
  isOwn,
  editedAt,
  deletedAt,
  replyAuthor,
  replyText,
  replyDeleted,
  forwardedFromAuthor,
  isDelivered,
  sendStatus,
  onRetry,
  isRead,
  onLongPress,
  attachments = [],
  downloadingAttachmentId = null,
  onAttachmentPress,
}: MessageProps) {
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={350}
      disabled={!onLongPress}
      style={[
        styles.container,
        isOwn
          ? styles.ownMessage
          : styles.otherMessage,
      ]}
    >
      {!isOwn && (
        <Text style={styles.author}>
          {author}
        </Text>
      )}

      {forwardedFromAuthor !== null && (
        <Text style={styles.forwardedText}>
          ↪ Переслано от {forwardedFromAuthor}
        </Text>
      )}

      {replyAuthor && (
        <View style={styles.replyContainer}>
          <Text style={styles.replyAuthor}>
            {replyAuthor}
          </Text>

          <Text
            style={styles.replyText}
            numberOfLines={2}
          >
            {replyDeleted
              ? 'Сообщение удалено'
              : replyText}
          </Text>
        </View>
      )}

      {(text || deletedAt !== null) && (
        <Text style={[
          styles.text,
          deletedAt !== null && styles.deletedText,
        ]}>
          {deletedAt !== null
            ? 'Сообщение удалено'
            : text}
        </Text>
      )}
      
      {deletedAt === null && attachments.map((attachment) => 
        attachment.type === 'image' &&
        chatId !== undefined &&
        token ? (
          <AttachmentImage
            key={attachment.id}
            chatId={chatId}
            attachment = {attachment}
            token={token}
            onPress={() => onAttachmentPress?.(attachment)}
            disabled={downloadingAttachmentId !== null}
          />
        ) : (
        <Pressable
          key={attachment.id}
          style={styles.attachmentCard}
          onPress={() => onAttachmentPress?.(attachment)}
          disabled={!onAttachmentPress || downloadingAttachmentId !== null}
        >
          <Text style={styles.attachmentIcon}>
            📄
          </Text>

          <View style={styles.attachmentInfo}>
            <Text
              numberOfLines={2}
              style={styles.attachmentName}
            >
              {attachment.originalName}
            </Text>

            <Text style={styles.attachmentSize}>
              {downloadingAttachmentId === attachment.id
                ? 'Скачивание...'
                : attachment.size < 1024
                  ? `${attachment.size} Б`
                  : attachment.size < 1024 * 1024
                    ? `${(attachment.size / 1024).toFixed(1)} КБ`
                    : `${(attachment.size / (1024 * 1024)).toFixed(1)} МБ`}
            </Text>
          </View>
        </Pressable>
      ))}

      <View style={styles.messageMeta}>
        <Text
          style={[
            styles.time,
            isOwn
              ? styles.ownTime
              : styles.otherTime,
          ]}
          numberOfLines={1}
        >
          {editedAt && !deletedAt 
            ? 'изменено · ' 
            : ''}
          {time}
        </Text>
        {isOwn && deletedAt === null && (
          <>
            {sendStatus === 'sending' ? (
              <Text style={styles.sendingStatus}>
                ◷
              </Text>
            ) : sendStatus === 'failed' ? (
              <Pressable
                onPress={onRetry}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.failedStatusButton,
                  pressed && styles.failedStatusPressed,
                ]}
              >
                <Text style={styles.failedStatus}>
                  !
                </Text>
              </Pressable>
            ) : (
              <Text style={[styles.deliveryStatus, isDelivered &&
                styles.doubleCheck, isRead && styles.readStatus,
              ]}
            >
              {isDelivered ? '✓✓' : '✓'}
            </Text>
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}
