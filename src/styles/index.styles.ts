import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'black',
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  chatPreview: {
    borderRadius: 12,
    paddingLeft: 5,
    paddingRight: 5,
  },
  chatPreviewPressed: {
    backgroundColor: '#27272a'
  }
});