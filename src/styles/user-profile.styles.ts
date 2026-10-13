import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },

  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    marginBottom: 12,
  },

  backText: {
    color: '#8ab4f8',
    fontSize: 16,
  },

  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 28,
  },

  loader: {
    marginTop: 50,
  },

  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },

  userName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
  },

  infoSection: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    marginBottom: 24,
  },

  label: {
    color: '#999999',
    fontSize: 14,
    marginBottom: 10,
  },

  bio: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
  },

  messageButton: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    minHeight: 48,
    backgroundColor: '#3279d8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  messageButtonPressed: {
    opacity: 0.65,
  },

  messageButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  error: {
    color: '#ff7777',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});