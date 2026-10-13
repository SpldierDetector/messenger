import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },

  content: {
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

  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },

  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#354a68',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '600',
  },

  avatarHint: {
    color: '#999999',
    fontSize: 13,
    textAlign: 'center',
  },

  form: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },

  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#424242',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },

  bioInput: {
    minHeight: 120,
  },

  counter: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 20,
  },

  error: {
    color: '#ff7777',
    fontSize: 14,
    marginBottom: 16,
  },

  success: {
    color: '#70D6a3',
    fontSize: 14,
    marginBottom: 16,
  },

  saveButton: {
    backgroundColor: '#3279D8',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  saveButtonDisabled: {
    opacity: 0.45,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  secondaryButton: {
    alignSelf: 'flex-start',
    padding: 16,
  },

  secondaryButtonText: {
    color: '#8ab4f8',
    fontSize: 16,
  },

  logoutButton: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },

  logoutButtonPressed: {
    opacity: 0.65,
  },

  logoutButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },

  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },

  avatarAction: {
    minHeight: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 10,
    marginBottom: 8,
  },

  avatarActionPressed: {
    opacity: 0.65,
  },

  avatarActionText: {
    color: '#8ab4f8',
    fontSize: 14,
    fontWeight: '600',
  },

  avatarDeleteAction: {
    paddingVertical: 8,
    marginBottom: 8,
  },

  avatarDeleteText: {
    color: '#ff6b6b',
    fontSize: 14,
  },
});