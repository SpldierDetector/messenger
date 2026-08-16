import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: 8,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },

  input: {
    flex: 1,
    backgroundColor: '#161616',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  searchButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },

  searchButtonText: {
    color: '#000000',
    fontWeight: '600',
  },

  buttonPressed: {
    opacity: 0.7,
  },

  error: {
    color: '#FF6B6B',
    marginBottom: 12,
  },

  emptyText: {
    color: '#777777',
    textAlign: 'center',
    marginTop: 32,
  },

  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },

  userItemPressed: {
    opacity: 0.65,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  userName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
});