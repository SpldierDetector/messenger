import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'black',
  },
  messages: {
    flex: 1,
  },
  input: {
    flex: 1,
    color: 'white',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: "row",
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    marginBottom: 10,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2563eb'
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonPressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  headerStatus: {
    color: '#22c55e',
    fontSize: 13,
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  headerInfo: {
    flex: 1,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 18,
  },
  callButtonPressed:{
    opacity: 0.7,
  },
  notFoundContainer:{
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  notFoundTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  notFoundButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  notFoundButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  backButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 28,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  errorText: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    color: '#ff6b6b',
    fontSize: 14,
  },
});