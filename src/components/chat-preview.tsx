import { StyleSheet, Text, View } from 'react-native';

type ChatPreviewProps = {
  name: string,
  lastMessage: string,
  time: string,
  isOnline: boolean,
  unreadCount: number,
};

export function ChatPreview({ 
  name,
  lastMessage,
  time,
  isOnline,
  unreadCount,
}: ChatPreviewProps){
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name[0]}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{name}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
            
          <View style={styles.bottomRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>{lastMessage}</Text>
              {isOnline && (<View style={styles.onlineDot} />)}

              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCount > 99
                      ? '99+'
                      : unreadCount}
                  </Text>
                </View>
              )}
          </View>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3f3f46',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  time: {
    color: 'grey',
    fontSize: 13,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessage: {
    flex: 1,
    color: 'gray',
    fontSize: 14,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginLeft: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    marginLeft: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
});