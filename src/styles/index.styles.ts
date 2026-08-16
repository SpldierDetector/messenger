import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'black',
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  chatPreview: {
    flex: 1,
    borderRadius: 12,
    paddingLeft: 5,
    paddingRight: 5,
  },
  chatPreviewPressed: {
    backgroundColor: '#27272a'
  },
  logoutButton: {
    minHeight: 38,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonPressed: {
    opacity: 0.65,
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
    includeFontPadding: false,
    
    transform: 
      Platform.OS === 'web'
      ? [{ translateY: -1 }]
      : []
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newChatButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  newChatButtonPressed: {
    opacity: 0.65,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '400',
    textAlign: 'center',
    includeFontPadding: false,
    
    transform: 
      Platform.OS === 'web'
      ? [{ translateY: -2 }]
      : []
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatMenuButton: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  chatMenuButtonPressed: {
    backgroundColor: '#27272a',
  },
  chatMenuButtonText: {
    color: '#a1a1aa',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '600',
    includeFontPadding: false,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor:
      'rgba(0, 0, 0, 0.6)',
  },
  contextMenu: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 8,
  },
  contextMenuTitle: {
    color: '#a1a1aa',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  contextMenuItem: {
    minHeight: 46,
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  contextMenuItemPressed: {
    backgroundColor: '#27272a',
  },
  deleteMenuText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDialog: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
  },
  confirmTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmDescription: {
    color: '#a1a1aa',
    fontSize: 15,
    lineHeight: 21,
  },
  deleteError: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 12,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
  },
  cancelButton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#27272A',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    minHeight: 42,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#7f1d1d',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  dialogButtonPressed: {
    opacity: 0.7,
  },
});