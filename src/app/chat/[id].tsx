import { Message } from '@/components/message';
import { useAuth } from '@/providers/auth-provider';
import { useMessages } from '@/providers/messages-provider';
import { 
  downloadAttachmentNative,
  downloadAttachmentWeb,
  uploadAttachment,
  uploadVoiceAttachment,
} from '@/services/attachments-service';
import { getChatRequest } from '@/services/chat-api';
import { styles } from '@/styles/chat.styles';
import type { ChatData } from '@/types/chat';
import type { 
  MessageData,
  AttachmentData, 
} from '@/types/message';
import {
  clearVoiceDraft,
  getVoiceDraft,
  saveVoiceDraft,
} from '@/services/voice-draft-service';
import {
  formatMessageDate,
  formatMessageTime,
  isSameDay
} from '@/utils/date';
import * as DocumentPicker from 'expo-document-picker';
import {
  Href,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ChatScreen() {
  const TYPING_STOP_DELAY = 1500;
  const MESSAGE_SEARCH_DELAY = 400;
  const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;
  const MAX_ATTACHMENTS_PER_MESSAGE = 10;
  const { id } = useLocalSearchParams();

  const { 
    messages,
    receipts,
    unreadCounts,
    typingUserIdsByChat,
    onlineByChat,
    isRealtimeConnected,
    lastSeenByChat,
    messageSearchResults,
    isSearchingMessages,
    messageSearchError,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    deleteMessageForMe,
    loadMessages,
    loadOlderMessages,
    hasMoreMessagesByChat,
    isLoadingOlderMessagesByChat,
    searchMessagesInChat,
    clearMessageSearch,
    isLoaded,
    isSending,
    markChatRead,
    startTyping,
    stopTyping,
    error
  } = useMessages();

  const { token, isAuthenticated } = useAuth();
  const chatId = Number(id);
  const [chat, setChat] = useState<ChatData | null>(null);
  const [chatLoadError, setChatLoadError] = useState<string | null>(null);
  const [isChatLoaded, setIsChatLoaded] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const realtimeIsOnline = onlineByChat[chatId];
  const isCompanionOnline = realtimeIsOnline ?? chat?.isOnline ?? false;
  const companionLastSeenAt = lastSeenByChat[chatId] ?? chat?.lastSeenAt?? null;
  const [
    selectedMessage,
    setSelectedMessage,
  ] = useState<MessageData | null>(null);
  const [
    isMessageMenuVisible,
    setIsMessageMenuVisible,
  ] = useState(false);
  const [replyingMessage, setReplyingMessage] = useState<MessageData | null>(null);
  const [text, setText] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<AttachmentData[]>([]);
  const [locallySeenUnreadMessageIds, setLocallySeenUnreadMessageIds] = useState<Set<number>>(() => new Set());
  const [isScrollToBottomVisible, setIsScrollToBottomVisible] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);
  const [attachmentDownloadError, setAttachmentDownloadError] = useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentUploadError, setAttachmentUploadError] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSearchPending, setIsSearchPending] = useState(false);
  const [messageSearchText, setMessageSearchText] = useState('');
  const [isInitialMessagePositionReady, setIsInitialMessagePositionReady] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioRecorderState = useAudioRecorderState(audioRecorder, 250);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVoiceUri, setRecordedVoiceUri] = useState<string | null>(null);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isCurrentChatMessagesLoaded, setIsCurrentChatMessagesLoaded] = useState(false);
  const voicePlayer = useAudioPlayer(null);
  const voicePlayerStatus = useAudioPlayerStatus(voicePlayer);
  const recordingBusyRef = useRef(false);  
  const listRef = useRef<FlatList>(null);
  const hasInitialScrollCompletedRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const initialScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isChatFocusedRef = useRef(false);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const unreadMessageIdsRef = useRef<Set<number>>(new Set());
  const visibleUnreadMessageIdsRef = useRef<Set<number>>(new Set());
  const previousScrollOffsetYRef = useRef<number | null>(null);
  const isScrollingTowardBottomRef = useRef(false);
  const scrollDirectionResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnreadAreaVisibleRef = useRef(false);
  const initialUnreadScrollRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialUnreadScrollAttemptsRef = useRef(0);
  const firstUnreadMessageIdRef = useRef<number | null>(null);
  const buttonScrollTargetIndexRef = useRef<number | null>(null);
  const buttonScrollAttemptsRef = useRef(0);
  const webUnreadCheckFrameRef = useRef<number | null>(null);
  const buttonScrollRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  function updateUnreadViewportProgress(
    visibleUnreadMessageIds: number[],
  ) {
    const nextVisibleIds = new Set(visibleUnreadMessageIds);

    isUnreadAreaVisibleRef.current = nextVisibleIds.size > 0;

    if (nextVisibleIds.size > 0) {
      buttonScrollTargetIndexRef.current = null;

      buttonScrollAttemptsRef.current = 0;
    }

    const previousVisibleIds = visibleUnreadMessageIdsRef.current;

    visibleUnreadMessageIdsRef.current = nextVisibleIds;

    if (
      !hasInitialScrollCompletedRef.current ||
      !isScrollingTowardBottomRef.current ||
      previousVisibleIds.size === 0
    ) {
      return;
    }

    const passedUnreadMessageIds: number[] = [];

    for (
      const messageId of
      previousVisibleIds
    ) {
      if (
        unreadMessageIdsRef.current.has(
          messageId,
        ) &&
        !nextVisibleIds.has(messageId)
      ) {
        passedUnreadMessageIds.push(messageId);
      }
    }

    if (
      passedUnreadMessageIds.length === 0
    ) {
      return;
    }

    setLocallySeenUnreadMessageIds(
      (currentIds) => {
        const nextIds =
          new Set(currentIds);

        let hasChanges = false;

        for (
          const messageId of
          passedUnreadMessageIds
        ) {
          if (!nextIds.has(messageId)) {
            nextIds.add(messageId);
            hasChanges = true;
          }
        }

        return hasChanges
          ? nextIds
          : currentIds;
      },
    );
  }

  const onViewableItemsChangedRef = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken[];
    }) => {
      const visibleUnreadMessageIds: number[] = [];

      for (const item of viewableItems) {
        if (!item.isViewable) {
          continue;
        }

        const message = item.item as MessageData;

        if (
          !unreadMessageIdsRef.current.has(
            message.id,
          )
        ) {
          continue;
        }

        visibleUnreadMessageIds.push(
          message.id,
        );
      }

      updateUnreadViewportProgress(visibleUnreadMessageIds);
    },
  );
  const isCompanionTyping = (typingUserIdsByChat[chatId]?.length ?? 0) > 0;

  useEffect(() => {
    if (
      !Number.isFinite(chatId) ||
      !token
    ) {
      return;
    }

    setRecordedVoiceUri(
      getVoiceDraft(chatId, token),
    );
  }, [
    chatId,
    token,
  ]);

  useEffect(() => {
    if (!Number.isFinite(chatId)) {
      setIsChatLoaded(true);
      return;
    }

    if (!isAuthenticated || !token) {
      return;
    }

    let isActive = true;

    setIsChatLoaded(false);
    setChatLoadError(null);

    const firstUnreadMessageId =
      unreadCounts.find(
        (count) =>
          count.chatId === chatId,
      )?.firstUnreadMessageId ?? null;

    firstUnreadMessageIdRef.current =
      firstUnreadMessageId;

    setIsCurrentChatMessagesLoaded(false);

    void loadMessages(
      chatId,
      firstUnreadMessageId,
    )
      .catch((error) => {
        console.warn(
          'Failed to load messages:',
          error,
        );
      })
      .finally(() =>{
        if (!isActive) {
          return;
        }

        setIsCurrentChatMessagesLoaded(true);
      });

    getChatRequest(chatId, token)
      .then((loadedChat) => {
        if (!isActive) {
          return;
        }

        setChat(loadedChat);
      })
      .catch((error) => {
        console.warn(`Failed to load chat:`, error);

        if (!isActive) {
          return;
        }

        setChatLoadError(
          'Не удалось загрузить чат. Проверьте подключение к сети.',
        );
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setIsChatLoaded(true);
      });
      return () => {
        isActive = false;
      };
  }, [chatId,isAuthenticated, token,]);

  useEffect(() => {
    if (!recordedVoiceUri) {
      return;
    }

    voicePlayer.pause();

    voicePlayer.replace({
      uri: recordedVoiceUri,
    });
  }, [recordedVoiceUri, voicePlayer]);
  
  useEffect(() => {
    hasInitialScrollCompletedRef.current = false;

    initialUnreadScrollAttemptsRef.current = 0;

    if (initialUnreadScrollRetryRef.current) {
      clearTimeout(
        initialUnreadScrollRetryRef.current,
      );

      initialUnreadScrollRetryRef.current = null;
    }

    if (initialScrollTimeoutRef.current) {
      clearTimeout(
        initialScrollTimeoutRef.current,
      );

      initialScrollTimeoutRef.current = null;
    }

    isNearBottomRef.current = true;
    
    setIsInitialMessagePositionReady(false);

    setLocallySeenUnreadMessageIds(new Set<number>());

    unreadMessageIdsRef.current = new Set();

    isUnreadAreaVisibleRef.current = false;

    setIsScrollToBottomVisible(false);

    buttonScrollTargetIndexRef.current = null;

    buttonScrollAttemptsRef.current = 0;

    visibleUnreadMessageIdsRef.current = new Set();

    previousScrollOffsetYRef.current = null;

    isScrollingTowardBottomRef.current = false;

    if (
      scrollDirectionResetTimeoutRef.current
    ) {
      clearTimeout(
        scrollDirectionResetTimeoutRef.current,
      );

      scrollDirectionResetTimeoutRef.current = null;
    }

    if (buttonScrollRetryRef.current) {
      clearTimeout(
        buttonScrollRetryRef.current,
      );

      buttonScrollRetryRef.current = null;
    }

    if (
      webUnreadCheckFrameRef.current !== null
    ) {
      cancelAnimationFrame(
        webUnreadCheckFrameRef.current,
      );

      webUnreadCheckFrameRef.current = null;
    }
  }, [chatId]);

  useEffect(() => {
    if (
      !isSearchMode ||
      !Number.isFinite(chatId)
    ) {
      setIsSearchPending(false);
      return;
    }

    const query = messageSearchText.trim();

    if (!query) {
      setIsSearchPending(false);
      clearMessageSearch();

      return;
    }

    setIsSearchPending(true);

    const timeoutId = setTimeout(
      () => {
        setIsSearchPending(false);

        void searchMessagesInChat(
          chatId,
          query,
        );
      },
      MESSAGE_SEARCH_DELAY,
    );

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    isSearchMode,
    messageSearchText,
    chatId,
  ]);

  useFocusEffect(
    useCallback(() => {
      isChatFocusedRef.current = true;
      
      if (
        Number.isFinite(chatId) &&
        isAuthenticated &&
        chat?.id === chatId &&
        !chatLoadError &&
        isInitialMessagePositionReady &&
        isNearBottomRef.current
      ) {
        markChatRead(chatId);
      }

      return () => {
        isChatFocusedRef.current = false;

        clearMessageSearch();

        if (typingStopTimerRef.current) {
          clearTimeout(typingStopTimerRef.current);

          typingStopTimerRef.current = null;
        }

        if (
          Number.isFinite(chatId) &&
          isTypingRef.current
        ) {
          stopTyping(chatId);

          isTypingRef.current = false;
        }
      };
    },  [
      chatId,
      chat?.id,
      chatLoadError,
      isAuthenticated,
      markChatRead,
      stopTyping,
      isInitialMessagePositionReady,
    ]), 
  );

  async function handleVoicePreviewPress() {
    if (!recordedVoiceUri) {
      return;
    }

    try {
      if (voicePlayerStatus.playing) {
        voicePlayer.pause();
        return;
      }

      if (
        voicePlayerStatus.didJustFinish ||
        (
          voicePlayerStatus.duration > 0 &&
          voicePlayerStatus.currentTime >=
            voicePlayerStatus.duration
        )
      ) {
        await voicePlayer.seekTo(0);
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
        interruptionMode: 'doNotMix',
      })

      voicePlayer.play();
    } catch (error) {
      console.error(
        'Failed to play voice preview:',
        error,
      );
    }
  }

  async function handleMicrophonePress() {
    if (recordingBusyRef.current) {
      return;
    }

    recordingBusyRef.current = true;

    try {
      if (isRecording) {
        await audioRecorder.stop();

        setIsRecording(false);

        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldRouteThroughEarpiece: false,
          interruptionMode: 'doNotMix',
        });

        const uri = audioRecorder.uri;

        if (!uri) {
          throw new Error('Recording URI is missing');
        }

        if (token) {
          saveVoiceDraft(
            chatId,
            token,
            uri,
          );
        }

        setRecordedVoiceUri(uri);

        console.log('Voice recording saved:', uri);

        return;
      }

      const permission = await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Нет доступа к микрофону',
          'Разрешите Voxa использовать микрофон.',
        );

        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      voicePlayer.pause();

      if (voicePlayerStatus.currentTime > 0) {
        await voicePlayer.seekTo(0);
      }

      await audioRecorder.prepareToRecordAsync();

      audioRecorder.record();

      setRecordedVoiceUri(null);
      setIsRecording(true);
    } catch (error) {
      console.error('Voice recording failed:', error);

      Alert.alert(
        'Ошибка записи',
        'Не удалось записать голосовое сообщение.',
      );
    } finally {
      recordingBusyRef.current = false;
    }
  }

  function formatVoiceDuration(
    seconds: number,
  ) {
    const totalSeconds = Math.max(
      0,
      Math.floor(seconds),
    );

    const minutes = Math.floor(
      totalSeconds / 60,
    );

    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  }

  async function handleCancelVoicePreview() {
    try {
      if (voicePlayerStatus.playing) {
        voicePlayer.pause();
      }

      await voicePlayer.seekTo(0);
    } catch (error) {
      console.warn(
        'Failed to reset voice preview:',
        error,
      );
    }

    if (token) {
      clearVoiceDraft(
        chatId,
        token,
      );
    }

    setRecordedVoiceUri(null);
  }

  const handlePickAttachment = async () => {
    if (
      !token ||
      isUploadingAttachment
    ) {
      return;
    }

    if (
      selectedAttachments.length >=
      MAX_ATTACHMENTS_PER_MESSAGE
    ) {
      setAttachmentUploadError(
        'К одному сообщению можно прикрепить не больше 10 файлов.',
      );

      return;
    }

    setAttachmentUploadError(null);

    try {
      setIsUploadingAttachment(true);

      const result =
        await DocumentPicker.getDocumentAsync({
          multiple: true,
          copyToCacheDirectory: true,
        });

      if (result.canceled) {
        return;
      }

      const assets = result.assets;

      if (
        selectedAttachments.length +
          assets.length >
        MAX_ATTACHMENTS_PER_MESSAGE
      ) {
        setAttachmentUploadError(
          'К одному сообщению можно прикрепить не больше 10 файлов.',
        );

        return;
      }

      const oversizedAsset =
        assets.find(
          (asset) =>
            typeof asset.size === 'number' &&
            asset.size >
              MAX_ATTACHMENT_SIZE,
        );

      if (oversizedAsset) {
        setAttachmentUploadError(
          `Файл «${oversizedAsset.name}» слишком большой. ` +
            'Максимальный размер вложения — 25 МБ.',
        );

        return;
      }

      const uploadedAttachments: AttachmentData[] = [];

      for (const asset of assets) {
        const attachment =
          await uploadAttachment(
            chatId,
            asset,
            token,
          );

        uploadedAttachments.push(attachment);
      }
      
      setSelectedAttachments(
        (currentAttachments) => [
          ...currentAttachments,
          ...uploadedAttachments,
        ],
      );

      setAttachmentUploadError(null);
    } catch (error) {
      console.error(
        'Failed to upload attachment:',
        error,
      );

      setAttachmentUploadError(
        'Не удалось загрузить файл. ' +
          'Проверьте подключение и попробуйте ещё раз.',
      );
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  async function handleAttachmentPress(
    attachment: AttachmentData,
  ) {
    if(!token || downloadingAttachmentId !== null) {
      return;
    }

    setDownloadingAttachmentId(attachment.id);
    setAttachmentDownloadError(null);

    try {
      if (Platform.OS === 'web') {
        await downloadAttachmentWeb(
          chatId,
          attachment,
          token,
        );
      } else {
        await downloadAttachmentNative(
          chatId,
          attachment,
          token,
        );
      }
    } catch (error) {
      console.error(
        'Failed to download attachment:',
        error,
      );

      setAttachmentDownloadError(
        `Не удалось скачать файл «${attachment.originalName}». ` +
        'Проверьте подключение и попробуйте ещё раз.',
      );
    } finally {
      setDownloadingAttachmentId(null);
    }
  }
  
  function finishInitialMessagePosition() {
    if (
      hasInitialScrollCompletedRef.current
    ) {
      return;
    }

    hasInitialScrollCompletedRef.current = true;

    setIsInitialMessagePositionReady(true);

    scheduleWebUnreadCheck();
  }
  
  const messageList = messages
    .filter(
      (message) => 
        message.chatId === chatId &&
        message.deletedAt === null,
    )
    .sort(
      (firstMessage, secondMessage) => {
        const createdAtDifference =
          secondMessage.createdAt -
          firstMessage.createdAt;

        if (createdAtDifference !== 0) {
          return createdAtDifference;
        }

        return(
          secondMessage.id -
          firstMessage.id
        );
      },
    );

  const currentUnreadState =
    unreadCounts.find(
      (count) =>
        count.chatId === chatId,
    );

  const currentUnreadCount =
    currentUnreadState?.unreadCount ?? 0;

  const currentFirstUnreadMessageId =
    currentUnreadState?.firstUnreadMessageId ??
    null;

  const currentFirstUnreadIndex =
    currentFirstUnreadMessageId !== null
      ? messageList.findIndex(
        (message) => 
          message.id ===
          currentFirstUnreadMessageId,
        )
      : -1;

  const currentUnreadMessages =
    currentFirstUnreadIndex >= 0
      ? messageList
        .slice(
          0,
          currentFirstUnreadIndex + 1,
        )
        .filter(
          (message) =>
            !message.isOwn,
        )
      : [];

  const currentUnreadMessageIds =
    currentUnreadMessages.map(
      (message) => message.id,
    );
  
  unreadMessageIdsRef.current = new Set(currentUnreadMessageIds);

  const locallySeenCurrentUnreadCount =
    currentUnreadMessages.reduce(
      (count, message) =>
        locallySeenUnreadMessageIds.has(
          message.id,
        )
          ? count + 1
          : count,
      0,
    );

  const unreadBadgeCount =
    Math.max(
      0,
      currentUnreadCount -
        locallySeenCurrentUnreadCount,
    );

  const firstUnseenUnreadMessage =
    [...currentUnreadMessages]
      .reverse()
      .find(
        (message) =>
          !locallySeenUnreadMessageIds.has(
            message.id,
          ),
      );

  const firstUnseenUnreadIndex =
    firstUnseenUnreadMessage
      ? messageList.findIndex(
        (message) =>
          message.id ===
          firstUnseenUnreadMessage.id,
      )
    : -1;
  
  useEffect(() => {
    if (currentUnreadCount !== 0) {
      return;
    }

    setLocallySeenUnreadMessageIds(
      (currentIds) =>
        currentIds.size === 0
          ? currentIds
          : new Set<number>(),
    );

    isUnreadAreaVisibleRef.current = false;
  }, [
    chatId,
    currentUnreadCount,
  ]);

  const searchResultList = [
    ...messageSearchResults,
  ].sort(
    (firstMessage, secondMessage) =>
      firstMessage.createdAt -
      secondMessage.createdAt,
  );

  const displayedMessages = 
    isSearchMode
      ? searchResultList
      : messageList;
  const latestMessage = messageList[0];
  const hasMoreMessages = hasMoreMessagesByChat[chatId] ?? false;
  const isLoadingOlderMessages = isLoadingOlderMessagesByChat[chatId] ?? false;
  const isSendDisabled = 
    (
      !text.trim() && 
      selectedAttachments.length === 0 &&
      !recordedVoiceUri
    ) ||
    isUploadingAttachment || 
    isUploadingVoice ||
    isEditing ||
    isRecording;

  useEffect(() => {
    if (
      isSearchMode ||
      !latestMessage ||
      !hasInitialScrollCompletedRef.current ||
      !isNearBottomRef.current
    ) {
      return;
    }

    const frameId =
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({
          offset: 0,
          animated: true,
        });
      });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    latestMessage?.id,
    isSearchMode,
  ]);
  
  useEffect(() => {
    if (
      !isChatFocusedRef.current ||
      !isAuthenticated ||
      !isInitialMessagePositionReady ||
      !isNearBottomRef.current ||
      !Number.isFinite(chatId) ||
      !latestMessage ||
      latestMessage.isOwn
    ) {
      return;
    }

    markChatRead(
      chatId,
    );
  }, [
    chatId,
    isAuthenticated,
    latestMessage?.id,
    markChatRead,
    isInitialMessagePositionReady,
  ]);

  function updateWebUnreadVisibility() {
    if (
      Platform.OS !== 'web' ||
      typeof document === 'undefined'
    ) {
      return;
    }

    const container =
      document.getElementById('messages-container');

      if (!container) {
        return;
      }

      const containerRect =
        container.getBoundingClientRect();

      const visibleUnreadMessageIds: number[] = [];

      for (
        const messageId of
        unreadMessageIdsRef.current
      ) {
        const element =
          document.getElementById(
            `message-${messageId}`,
          );

        if (!element) {
          continue;
        }

        const messageRect =
          element.getBoundingClientRect();

        const isVisible =
          messageRect.bottom > containerRect.top &&
          messageRect.top < containerRect.bottom;

        if (isVisible) {
          visibleUnreadMessageIds.push(
            messageId,
          );
        }
      }
    
    updateUnreadViewportProgress(visibleUnreadMessageIds);
  }

  function scheduleWebUnreadCheck() {
    if (Platform.OS !== 'web') {
      return;
    }

    if (
      webUnreadCheckFrameRef.current !== null
    ) {
      cancelAnimationFrame(
        webUnreadCheckFrameRef.current,
      );
    }

    webUnreadCheckFrameRef.current =
      requestAnimationFrame(() => {
        webUnreadCheckFrameRef.current = null;

        updateWebUnreadVisibility();
      });
  }
  
  function handleScrollToBottomPress() {
    if (
      unreadBadgeCount > 0 &&
      firstUnseenUnreadIndex >= 0 &&
      !isUnreadAreaVisibleRef.current
    ) {
      buttonScrollTargetIndexRef.current = firstUnseenUnreadIndex;

      buttonScrollAttemptsRef.current = 0;

      listRef.current?.scrollToIndex({
        index: firstUnseenUnreadIndex,
        animated: true,
        viewPosition: 0,
      });

      return;
    }

    buttonScrollTargetIndexRef.current = null;

    buttonScrollAttemptsRef.current = 0;

    listRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  }

  function handleMessagesScroll(
    offsetY: number,
    viewportHeight: number,
    contentHeight: number,
  ) {
    const BOTTOM_THRESHOLD = 120;
    const TOP_THRESHOLD = 100;
    const previousOffsetY = previousScrollOffsetYRef.current;

    if (previousOffsetY !== null) {
      const offsetDifference = offsetY - previousOffsetY;

      if (
        Math.abs(offsetDifference) > 0.5
      ) {
        isScrollingTowardBottomRef.current = offsetDifference < 0;
      }
    }

    previousScrollOffsetYRef.current = offsetY;

    if (
      scrollDirectionResetTimeoutRef.current
    ) {
      clearTimeout(
        scrollDirectionResetTimeoutRef.current
      );
    }

    scrollDirectionResetTimeoutRef.current =
      setTimeout(() => {
        isScrollingTowardBottomRef.current = false;

        scrollDirectionResetTimeoutRef.current = null;
      }, 120);

    const wasNearBottom = isNearBottomRef.current;
    const isNearBottom = offsetY <= BOTTOM_THRESHOLD;

    isNearBottomRef.current = isNearBottom;

    if (wasNearBottom !== isNearBottom) {
      setIsScrollToBottomVisible(
        !isNearBottom,
      );
    }

    if (
      !wasNearBottom &&
      isNearBottom &&
      hasInitialScrollCompletedRef.current &&
      isChatFocusedRef.current &&
      isAuthenticated &&
      Number.isFinite(chatId)
    ) {
      markChatRead(chatId);
    }

    if (
      isSearchMode ||
      !hasInitialScrollCompletedRef.current ||
      isLoadingOlderMessages ||
      !hasMoreMessages ||
      offsetY + viewportHeight <
        contentHeight - TOP_THRESHOLD
    ) {
      return;
    }

    void loadOlderMessages(chatId);
  }
  
  function handleOpenMessageMenu(
    message: MessageData,
  ) {
    setSelectedMessage(message);
    setIsMessageMenuVisible(true);;
  }

  function handleCloseMessageMenu() {
    setIsMessageMenuVisible(false);
  }

  function handleBackPress() {
    if (isSearchMode) {
      handleCloseSearch();
      return;
    }
    
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }

  function handleOpenSearch() {
    handleStopTyping();

    setIsSearchMode(true);
    setMessageSearchText('');
    setIsSearchPending(false);
    clearMessageSearch();
  }

  function handleCloseSearch() {
    setIsSearchMode(false);
    setMessageSearchText('');
    setIsSearchPending(false);
    clearMessageSearch();
  }

  function handleStartEditing(
    messageId: number,
    messageText: string,
  ) {
    setReplyingMessage(null);
    setEditingMessageId(messageId);
    setText(messageText);
  }

  function handleCancelEditing() {
    handleStopTyping();
    
    setEditingMessageId(null);
    setText('');
  }

  function handleStartReply(
    message: MessageData,
  ) {
    handleStopTyping();

    setEditingMessageId(null);
    setText('');
    setReplyingMessage(message);
    handleCloseMessageMenu();
  }

  function handleCancelReply() {
    setReplyingMessage(null);
  }

  function handleStartForward(
    messageId: number,
  ) {
    handleCloseMessageMenu();

    router.push(
      `/forward-message?messageId=${messageId}` as Href,
    );
  }

  function handleStopTyping() {
    if (typingStopTimerRef.current) {
      clearTimeout(
        typingStopTimerRef.current,
      );

      typingStopTimerRef.current = null;
    }

    if (!isTypingRef.current) {
      return;
    }

    stopTyping(chatId);

    isTypingRef.current = false;
  }

  function handleTextChange(
    value: string,
  ) {
    setText(value);

    if (
      !isAuthenticated ||
      !Number.isFinite(chatId)
    ) {
      return;
    }

    if (!value.trim()) {
      handleStopTyping();

      return;
    }

    if (!isTypingRef.current) {
      startTyping(chatId);

      isTypingRef.current = true;
    }

    if (typingStopTimerRef.current) {
      clearTimeout(
        typingStopTimerRef.current,
      );
    }

    typingStopTimerRef.current =
      setTimeout(() => {
        stopTyping(chatId);

        isTypingRef.current = false;
        typingStopTimerRef.current = null;
      }, TYPING_STOP_DELAY);
  }

  function formatLastSeen(
    lastSeenAt: number | null,
  ) {
    if (!lastSeenAt) {
      return 'offline';
    }

    const now = new Date();
    const lastSeenDate = new Date(lastSeenAt);
    
    const sameDay =
      now.getFullYear() === lastSeenDate.getFullYear() &&
      now.getMonth() === lastSeenDate.getMonth() &&
      now.getDate() === lastSeenDate.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const wasYesterday =
      yesterday.getFullYear() === lastSeenDate.getFullYear() &&
      yesterday.getMonth() === lastSeenDate.getMonth() &&
      yesterday.getDate() === lastSeenDate.getDate();

    const time =
      lastSeenDate.toLocaleTimeString(
        'ru-RU',
        {
          hour: '2-digit',
          minute: '2-digit',
        },
      );
    if (sameDay) {
      return `был сегодня в ${time}`;
    }

    if (wasYesterday) {
      return `был вчера в ${time}`;
    }

    const date =
      lastSeenDate.toLocaleDateString(
        'ru-RU',
        {
          day: 'numeric',
          month: 'long',
        },
      );

    return `был ${date} в ${time}`;
  }

  async function handleSend() {
    const normalizedText = text.trim();

    if (
      !normalizedText && 
      selectedAttachments.length === 0 &&
      !recordedVoiceUri
    ) {
      return;
    }

    if (
      isUploadingAttachment || 
      isUploadingVoice ||  
      isEditing ||
      isRecording
    ) {
      return;
    }

    handleStopTyping();

    if (editingMessageId !== null) {
      try {
        setIsEditing(true);

        const wasEdited = await editMessage(
          editingMessageId,
          normalizedText,
        );

        if (wasEdited) {
          setText('');
          setEditingMessageId(null);
        }
      } finally {
        setIsEditing(false);
      }

      return;
    }

    const replyToMessageId = replyingMessage?.id ?? null;
    const attachments: AttachmentData[] = [
      ...selectedAttachments,
    ];
    
    if (recordedVoiceUri) {
      if (!token) {
        return;
      }

      try {
        setIsUploadingVoice(true);

        const voiceAttachment =
          await uploadVoiceAttachment(
            chatId,
            recordedVoiceUri,
            token,
          );

        attachments.push(
          voiceAttachment,
        );
      } catch (error) {
        console.error(
          'Failed to upload voice message:',
          error,
        );

        return;
      } finally {
        setIsUploadingVoice(false);
      }
    }

    voicePlayer.pause();

    setText('');
    setReplyingMessage(null);
    setSelectedAttachments([]);

    if (token) {
      clearVoiceDraft(
        chatId,
        token,
      );
    }

    setRecordedVoiceUri(null);

    void sendMessage(
      chatId,
      normalizedText,
      replyToMessageId,
      attachments,
    );
  }
  
  if (!isChatLoaded) {
    return null;
  }

  if (chatLoadError) {
    return (
      <SafeAreaView
        style={styles.notFoundContainer}
      >
        <Text style={styles.notFoundTitle}>
          Нет соединения
        </Text>

        <Text style={styles.errorText}>
          {chatLoadError}
        </Text>

        <Pressable
          style={styles.notFoundButton}
          onPress={() => router.back()}
          >
            <Text style={styles.notFoundButtonText}>
              Вернуться к чатам
            </Text>
          </Pressable>
      </SafeAreaView>
    );
  }
  
  if (!chat) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundTitle}>Чат не найден</Text>

        <Pressable
          style={styles.notFoundButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.notFoundButtonText}>
            Вернуться к чатам
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  } 

  if (!isLoaded || !isCurrentChatMessagesLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable 
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>

          {isSearchMode ? (
            <>
              <TextInput
                value={messageSearchText}
                onChangeText={setMessageSearchText}
                placeholder="Поиск по сообщениям"
                placeholderTextColor="#777777"
                autoFocus
                autoCorrect={false}
                style={styles.searchInput}
              />

              <Pressable
                onPress={handleCloseSearch}
                style={({ pressed }) => [
                  styles.closeSearchButton,
                  pressed &&
                    styles.searchButtonPressed,
                ]}
              >
                <Text style={styles.closeSearchButtonText}>
                  ✕
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{chat.name[0]}</Text>
              </View>

              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>{chat.name}</Text>
                <Text style={styles.headerStatus}>
                  {!isRealtimeConnected
                    ? 'offline'
                    : !isCompanionOnline
                      ? formatLastSeen(companionLastSeenAt)
                      : isCompanionTyping
                        ? 'печатает...'
                        : 'online'}
                </Text>
              </View>

              <Pressable
                onPress={handleOpenSearch}
                style={({ pressed }) => [
                  styles.searchButton,
                  pressed && styles.searchButtonPressed,
                ]}
              >
                <Text style={styles.searchButtonText}>
                  🔍
                </Text>
              </Pressable>
              
              <Pressable style={({ pressed }) => [styles.callButton,
              pressed && styles.callButtonPressed,]}>
                <Text style={styles.callButtonText}>📞</Text>
              </Pressable>
            </>
          )}  
        </View>

        {isSearchMode && (
          <View style={styles.searchStatus}>
            <Text style={styles.searchStatusText}>
              {!messageSearchText.trim()
                ? 'Введите текст для поиска'
                : isSearchingMessages || isSearchPending
                  ? 'Поиск...'
                  : messageSearchError
                    ? messageSearchError
                    : messageSearchResults.length === 0
                      ? 'Сообщения не найдены'
                      : `Найдено: ${messageSearchResults.length}`}
            </Text>
          </View>
        )}
      
        <View 
          style={styles.messagesContainer}
          nativeID="messages-container"  
        >
        <FlatList
          ref={listRef}
          style={[
            styles.messages,
            !isSearchMode &&
              !isInitialMessagePositionReady &&
              styles.messagesPreparing,
          ]}
          data={displayedMessages}
          inverted={!isSearchMode}
          maintainVisibleContentPosition={
            isSearchMode ||
            !isInitialMessagePositionReady
              ? undefined
              : {
                minIndexForVisible: 0,
              }
          }
          onViewableItemsChanged={onViewableItemsChangedRef.current}
          onContentSizeChange={() => {
            if (
              isSearchMode ||
              messageList.length === 0 ||
              hasInitialScrollCompletedRef.current
            ) {
              return;
            }

            if (initialScrollTimeoutRef.current) {
              clearTimeout(
                initialScrollTimeoutRef.current
              );
            }

            initialScrollTimeoutRef.current =
              setTimeout(() => {
                  initialScrollTimeoutRef.current = null;

                  const firstUnreadMessageId = firstUnreadMessageIdRef.current;

                  if (firstUnreadMessageId === null) {
                    listRef.current?.scrollToOffset({
                      offset: 0,
                      animated: false,
                    });

                    requestAnimationFrame(() => {
                      finishInitialMessagePosition();
                    });

                    return;
                  }

                  const unreadIndex =
                    messageList.findIndex(
                      (message) =>
                        message.id ===
                        firstUnreadMessageId,
                    );

                  if (unreadIndex < 0) {
                    listRef.current?.scrollToOffset({
                      offset: 0,
                      animated: false,
                    });

                    requestAnimationFrame(() => {
                      finishInitialMessagePosition();
                    });

                    return;
                  }

                  setIsScrollToBottomVisible(true);

                  isNearBottomRef.current = false;
                  
                  listRef.current?.scrollToIndex({
                    index: unreadIndex,
                    animated: false,
                    viewPosition: 0,
                  });

                  setTimeout(() => {
                    finishInitialMessagePosition();
                }, 150);
              }, 150);
          }}
          onScroll={(event) => {
            const {
              contentOffset,
              layoutMeasurement,
              contentSize,
            } = event.nativeEvent;

            handleMessagesScroll(
              contentOffset.y,
              layoutMeasurement.height,
              contentSize.height,
            );

            scheduleWebUnreadCheck();
          }}
          onScrollToIndexFailed={(info) => {
            if (
              buttonScrollTargetIndexRef.current !== null
            ) {
              buttonScrollAttemptsRef.current += 1;

              listRef.current?.scrollToOffset({
                offset:
                  info.averageItemLength *
                  info.index,
                animated: false,
              });

              if (
                buttonScrollAttemptsRef.current >= 3
              ) {
                buttonScrollTargetIndexRef.current = null;

                buttonScrollAttemptsRef.current = 0;
                
                return;
              }

              if (buttonScrollRetryRef.current) {
                clearTimeout(
                  buttonScrollRetryRef.current,
                );
              }

              buttonScrollRetryRef.current =
              setTimeout(() => {
                buttonScrollRetryRef.current = null;

                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0,
                });
              }, 100)

              return;
            }
            
            if (
              hasInitialScrollCompletedRef.current ||
              isSearchMode
            ) {
              return;
            }

            initialUnreadScrollAttemptsRef.current += 1;

            listRef.current?.scrollToOffset({
              offset:
                info.averageItemLength *
                info.index,
              animated: false,
            });

            if (
              initialUnreadScrollAttemptsRef.current >= 3
            ) {
              finishInitialMessagePosition();

              return;
            }

            if (initialUnreadScrollRetryRef.current) {
              clearTimeout(
                initialUnreadScrollRetryRef.current,
              );
            }

            initialUnreadScrollRetryRef.current =
              setTimeout(() => {
                initialUnreadScrollRetryRef.current = null;

                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0,
                });

                setTimeout(() => {
                  finishInitialMessagePosition();
                }, 150);
              }, 100);
          }}
          scrollEventThrottle={16}
          keyExtractor={(message) => message.id.toString()}
          renderItem={({ item, index }) => {
            const previousMessage = 
              isSearchMode
                ? displayedMessages[index - 1]
                : displayedMessages[index + 1];

            const messageReceipt =
              receipts.find(
                (receipt) =>
                  receipt.messageId === item.id,
              );

            const isDelivered =
              messageReceipt?.deliveredAt !== null &&
              messageReceipt?.deliveredAt !== undefined;

            const isRead =
              messageReceipt?.readAt !== null &&
              messageReceipt?.readAt !== undefined;

            const repliedMessage = 
            item.replyToMessageId !== null
              ? messages.find(
                (message) =>
                  message.id === item.replyToMessageId,
              )
              : undefined;

            const hasReply =
              item.replyToMessageId !== null;

            const shouldShowDate =
              !previousMessage ||
              !isSameDay(
                previousMessage.createdAt,
                item.createdAt
              );

            const shouldShowUnreadSeparator =
              !isSearchMode &&
              firstUnreadMessageIdRef.current !== null &&
              item.id === firstUnreadMessageIdRef.current;

            return (
              <View nativeID={`message-${item.id}`}>
                {shouldShowDate && (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>
                      {formatMessageDate(item.createdAt)}
                    </Text>
                  </View>
                )}

                {shouldShowUnreadSeparator && (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>
                      Непрочитанные
                    </Text>
                  </View>
                )}

                <Message
                  author={
                    item.isOwn
                      ? item.author
                      : chat.name ?? item.author
                  }
                  text={item.text}
                  time={formatMessageTime(item.createdAt)}
                  isOwn={item.isOwn}
                  editedAt={item.editedAt}
                  deletedAt={item.deletedAt}
                  sendStatus={item.sendStatus}
                  attachments={item.attachments}
                  chatId={chatId}
                  token={token}
                  downloadingAttachmentId={downloadingAttachmentId}
                  onAttachmentPress={(attachment) => {void handleAttachmentPress(attachment)}}
                  onRetry={
                    item.sendStatus === 'failed' &&
                    item.clientMessageId
                      ? () => {
                        void retryMessage(
                          item.clientMessageId,
                        );
                      }
                      : undefined
                  }
                  replyAuthor={
                    hasReply
                      ? repliedMessage?.author ?? 'Ответ'
                      : undefined
                  }
                  replyText={
                    hasReply
                      ? repliedMessage?.text ??
                        'Исходное сообщение недоступно'
                      : undefined
                  }
                  replyDeleted={
                    repliedMessage
                      ? repliedMessage.deletedAt !== null
                      : false
                  }
                  forwardedFromAuthor={
                    item.forwardedFromAuthor
                  }
                  isDelivered={isDelivered}
                  isRead={isRead}
                  onLongPress={
                    item.sendStatus === null &&
                    item.deletedAt === null
                      ? () => handleOpenMessageMenu(item)
                      : undefined                  
                  }
                />
              </View>
            )
          }}
        />

        {!isSearchMode &&
          isInitialMessagePositionReady &&
          isScrollToBottomVisible && (
            <Pressable
              onPress={handleScrollToBottomPress}
              style={({ pressed }) => [
                styles.scrollToBottomButton,
                pressed && styles.scrollToBottomButtonPressed,
              ]}
            >
              <Text
                style={styles.scrollToBottomButtonText}
              >
                ↓
              </Text>

              {unreadBadgeCount > 0 && (
                <View
                  style={styles.scrollToBottomBadge}
                >
                  <Text style={styles.scrollToBottomBadgeText}>
                    {unreadBadgeCount > 99
                      ? '99+'
                      : unreadBadgeCount}
                  </Text>
                </View>
              )}
            </Pressable>
          )
        }
        </View>

        <Modal
          visible={isMessageMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={
            handleCloseMessageMenu
          }
        >
          <View style={styles.messageMenuRoot}>
            <Pressable
              style={styles.messageMenuBackdrop}
              onPress={handleCloseMessageMenu}
            />

            <View style={styles.messageMenu}>
              <Pressable
                style={styles.messageMenuItem}
                onPress={() => {
                  if (!selectedMessage) {
                    return;
                  }

                  handleStartReply(
                    selectedMessage,
                  );
                }}
              >
                <Text style={styles.messageMenuText}>
                  Ответить
                </Text>
              </Pressable>

              <Pressable
                style={styles.messageMenuItem}
                onPress={() => {
                  if (!selectedMessage) {
                    return;
                  }

                  handleStartForward(
                    selectedMessage.id,
                  );
                }}
                >
                  <Text style={styles.messageMenuText}>
                    Переслать
                  </Text>
                </Pressable>

              {selectedMessage?.isOwn &&(
                <Pressable
                  style={styles.messageMenuItem}
                  onPress={() =>{
                    if (!selectedMessage) {
                      return;
                    }

                    handleStartEditing(
                      selectedMessage.id,
                      selectedMessage.text,
                    );

                    handleCloseMessageMenu();
                  }}
                >
                  <Text style={styles.messageMenuText}>
                    Редактировать
                  </Text>
                </Pressable>
              )}
              
              <Pressable
                style={styles.messageMenuItem}
                onPress={async () => {
                  if (!selectedMessage) {
                    return;
                  }

                  const messageId = selectedMessage.id;

                  handleCloseMessageMenu();

                  await deleteMessageForMe(messageId);
                }}
              >
                <Text style={styles.deleteMessageMenuText}>
                  Удалить у меня
                </Text>
              </Pressable>
              
              {selectedMessage?.isOwn &&(
                <Pressable
                  style={styles.messageMenuItem}
                  onPress={async () => {
                    if (!selectedMessage) {
                      return;
                    }

                    const messageId =
                      selectedMessage.id;

                    handleCloseMessageMenu();

                    await deleteMessage(messageId);
                  }}
                >
                  <Text style={styles.deleteMessageMenuText}>
                    Удалить у всех
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </Modal>
        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}

        {attachmentDownloadError && (
          <Text style={styles.errorText}>
            {attachmentDownloadError}
          </Text>
        )}

        {!isSearchMode && (
          <>
            {editingMessageId !== null && (
              <View style={styles.editingBar}>
                <View style={styles.editingInfo}>
                  <Text style={styles.editingTitle}>
                    Редактирование сообщения
                  </Text>

                  <Text
                    style={styles.editingText}
                    numberOfLines={1}
                  >
                    {text}
                  </Text>
                </View>

                <Pressable
                  onPress={handleCancelEditing}
                  style={styles.cancelEditButton}
                >
                  <Text style={styles.cancelEditButtonText}>
                    ✕
                  </Text>
                </Pressable>
              </View>
            )}

            {replyingMessage !== null &&(
              <View style={styles.replyingBar}>
                <View style={styles.replyingInfo}>
                  <Text style={styles.replyingTitle}>
                    Ответ: {replyingMessage.author}
                  </Text>

                  <Text
                    style={styles.replyingText}
                    numberOfLines={1}
                  >
                    {replyingMessage.text}
                  </Text>
                </View>

                <Pressable
                  onPress={handleCancelReply}
                  style={styles.cancelReplyButton}
                >
                  <Text style={styles.cancelReplyButtonText}>
                    ✕
                  </Text>
                </Pressable>
              </View>
            )}

            {attachmentUploadError && (
              <Text style={styles.errorText}>
                {attachmentUploadError}
              </Text>
            )}

            {isUploadingAttachment && (
              <View style={styles.attachmentBar}>
                <Text style={styles.attachmentIcon}>
                  📄
                </Text>

                <Text style={styles.attachmentName}>
                  Загрузка файла...
                </Text>
              </View>
            )}

            {selectedAttachments.map(
              (attachment) => (
              <View 
                key={attachment.id} 
                style={styles.attachmentBar}
              >
                <Text style={styles.attachmentIcon}>
                  📄
                </Text>
                
                <Text
                  numberOfLines={1}
                  style={styles.attachmentName}
                >
                  {attachment.originalName}
                </Text>
                
                <Pressable
                  style={styles.attachmentRemoveButton}
                  onPress={() => {
                    setSelectedAttachments(
                      (currentAttachments) =>
                        currentAttachments.filter(
                          (currentAttachment) =>
                            currentAttachment.id !==
                            attachment.id,
                        ),
                    );
                  }}
                >
                    <Text style={styles.attachmentRemoveText}>
                      ✕
                    </Text>
                  </Pressable>
              </View>
            ),
          )}

            {recordedVoiceUri && !isRecording && (
              <View style={styles.voicePreview}>
                <Pressable
                  style={styles.voicePreviewButton}
                  onPress={() => {
                    void handleVoicePreviewPress();
                  }}
                >
                  <Text style={styles.voicePreviewButtonText}>
                    {voicePlayerStatus.playing ? '⏸' : '▶️'}
                  </Text>
                </Pressable>

                <Text style={styles.voicePreviewText}>
                  {formatVoiceDuration(
                    voicePlayerStatus.currentTime,
                  )}
                  {' / '}
                  {formatVoiceDuration(
                    voicePlayerStatus.duration,
                  )}
                </Text>

                <Pressable
                  style={styles.voicePreviewCancelButton}
                  onPress={() => {
                    void handleCancelVoicePreview();
                  }}
                >
                  <Text style={styles.voicePreviewCancelText}>
                    ✕
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput 
                  value={text}
                  onChangeText={handleTextChange}
                  placeholder="Написать сообщение..."
                  placeholderTextColor='gray'
                  style={styles.input}
                  multiline
                />
                <Pressable
                  style={styles.attachmentButton}
                  onPress={handlePickAttachment}
                >
                  <Text>📎</Text>
                </Pressable>
              </View>
              {isRecording && (
                <Text style={styles.recordingDuration}>
                  {formatVoiceDuration(
                    audioRecorderState.durationMillis / 1000,
                  )}
                </Text>
              )}
              <Pressable
                style={styles.attachmentButton}
                onPress={() => {
                  void handleMicrophonePress();
                }}
              >
                <Text>{isRecording ? '⏹️' : '🎤'}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.sendButton, 
                  isSendDisabled && styles.sendButtonDisabled,
                  pressed && !isSendDisabled && styles.sendButtonPressed,
                ]}
                onPress={handleSend}
                disabled={isSendDisabled}
              >
                <Text style={styles.sendButtonText}>
                  {isEditing
                    ? '...' 
                    : editingMessageId !== null
                      ? 'Save'
                      : 'Send'}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}