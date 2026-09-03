import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  backButtonText: {
    color: 'white',
    fontSize: 28,
  },

  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },

  chatList: {
    paddingVertical: 8,
  },

  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  chatItemPressed: {
    backgroundColor: '#27272a',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  chatInfo: {
    flex: 1,
  },

  chatName: {
    color: 'white',
    fontSize: 17,
    fontWeight: '500',
  },

  chatStatus: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 3,
  },

  errorText: {
    color: '#f87171',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});