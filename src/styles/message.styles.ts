import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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

  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    marginTop: 4,
  },

  deliveryStatus: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },

  doubleCheck: {
    letterSpacing: -3,
  },

  readStatus: {
    color: '#4ade80',
  },
  
  time: {
    fontSize: 12,
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

  forwardedText: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },

  sendingStatus: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },

  failedStatusButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  failedStatusPressed: {
    opacity: 0.7,
  },

  failedStatus: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },

  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },

  attachmentIcon: {
    fontSize: 24,
  },
  attachmentInfo: {
    flexShrink: 1,
    minWidth: 0,
  },
  attachmentName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  attachmentSize: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    marginTop: 3,
  },

  attachmentImage: {
    width: 200,
    maxWidth: '100%',
    height: 160,
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  attachmentImagePreview: {
    width: '100%',
    height: '100%',
  },

  attachmentImagePlaceholder: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    padding: 10,
  },

  imageViewer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 16,
  },

  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },

  imageViewerButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  imageViewerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  imageViewerPhoto: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
})