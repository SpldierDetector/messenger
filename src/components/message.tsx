import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  onLongPress?: () => void;
};

export function Message({
  author,
  text,
  time,
  isOwn,
  editedAt,
  deletedAt,
  replyAuthor,
  replyText,
  replyDeleted,
  onLongPress,
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

      <Text style={[
        styles.text,
        deletedAt !== null && styles.deletedText,
      ]}>
        {deletedAt !== null
          ? 'Сообщение удалено'
          : text}
      </Text>

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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    maxWidth: '75%',
    minWidth: 90,
    borderRadius: 18,
    marginBottom: 8,
  },

  author: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  text: {
    color: 'white',
  },

  time: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 4,
    textAlign: 'right',
  },

  ownTime: {
    color: 'rgba(255, 255, 255, 0.6)',
  },

  otherTime: {
    color: 'gray',
  },

  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 3,
  },

  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#27272a',
    borderBottomLeftRadius: 3,
  },

  deletedText: {
    color: '#a1a1aa',
    fontStyle: 'italic',
  },

  replyContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#93c5fd',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },

  replyAuthor: {
    color: '#bfdbfe',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },

  replyText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
  },
});