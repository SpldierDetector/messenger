import type { AttachmentData } from '@/types/message';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/api';
import {
  Directory,
  File,
  Paths,
  UploadType,
} from 'expo-file-system';
import * as Sharing from 'expo-sharing';

async function uploadNativeAttachment(
  chatId: number,
  uri: string,
  originalName: string,
  mimeType: string,
  token: string,
): Promise<AttachmentData> {
  const file = new File(uri);

  const result = await file.upload(
    `${API_BASE_URL}/chats/${chatId}/attachments`,
    {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      fieldName: 'file',
      mimeType,
      parameters: {
        originalName,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (
    result.status < 200 ||
    result.status >= 300
  ) {
    throw new Error(
      `Failed to upload attachment: ` +
      `${result.status} ${result.body}`,
    );
  }

  return JSON.parse(result.body) as AttachmentData;
}

export async function uploadAttachment(
  chatId: number,
  asset: DocumentPickerAsset,
  token: string,
): Promise<AttachmentData> {
  if (Platform.OS !== 'web') {
    return uploadNativeAttachment(
      chatId,
      asset.uri,
      asset.name,
      asset.mimeType ?? 'application/octet-stream',
      token,
    );
  }

  if (!asset.file) {
    throw new Error(
      'Selected file is unavailable',
    );
  }

  const formData = new FormData();

  formData.append(
    'file',
    asset.file,
    asset.name,
  );

  const response = await fetch(
    `${API_BASE_URL}/chats/${chatId}/attachments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Failed to upload attachment: ` +
      `${response.status} ${errorBody}`,
    );
  }

  return (await response.json()) as AttachmentData;
}

export async function downloadAttachmentWeb(
  chatId: number,
  attachment: AttachmentData,
  token: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/chats/${chatId}/attachments/${attachment.id}/download`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to download attachment: HTTP ${response.status}`,
    );
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = downloadUrl;
  link.download = attachment.originalName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 60_000);
}

const SHARED_FILE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cleanupOldSharedFiles(): void {
  const now = Date.now();
  const cachedItems = Paths.cache.list();

  for (const item of cachedItems) {
    if (!(item instanceof Directory)) {
      continue;
    }

    const match = item.name.match(
      /^voxa-\d+-\d+-(\d{13})$/,
    );

    if (!match) {
      continue;
    }

    const createdAt = Number(match[1]);

    if (
      !Number.isFinite(createdAt) ||
      now - createdAt < SHARED_FILE_MAX_AGE_MS
    ) {
      continue;
    }

    try {
      item.delete();
    } catch (error) {
      console.warn(
        'Failed to clean up shared file:',
        error,
      );
    }
  }
}

export async function downloadAttachmentNative(
  chatId: number,
  attachment: AttachmentData,
  token: string,
): Promise<void> {
  const sharingAvailable = await Sharing.isAvailableAsync();

  if (!sharingAvailable) {
    throw new Error(
      'File sharing is not available on this device',
    );
  }

  try {
    cleanupOldSharedFiles();
  } catch (error) {
    console.warn(
      'Failed to clean up attachment cache:',
      error,
    );
  }

  const downloadUrl =
    `${API_BASE_URL}/chats/${chatId}` +
    `/attachments/${attachment.id}/download`;

  const directory = new Directory(
    Paths.cache,
    `voxa-${chatId}-${attachment.id}-${Date.now()}`,
  );

  directory.create()

  const fileName =
    attachment.originalName.replace(/[\\/]/g, '_') || 'attachment';

  const destination = new File(directory, fileName);

  let downloadedFile: File;

  try {
    downloadedFile = await File.downloadFileAsync(
      downloadUrl,
      destination,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error) {
    try {
      if (directory.exists) {
        directory.delete();
      }
    } catch (cleanupError) {
      console.warn(
        'Failed to clean up incomplete download:',
        cleanupError,
      );
    }

    throw error;
  }

  await Sharing.shareAsync(
    downloadedFile.uri,
    {
      mimeType: attachment.mimeType,
      dialogTitle: 'Сохранить или поделиться файлом',
    },
  );
}

export async function loadAttachmentImageWeb(
  chatId: number,
  attachment: AttachmentData,
  token: string,
): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/chats/${chatId}/attachments/${attachment.id}/download`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load image: HTTP ${response.status}`,
    );
  }

  const blob = await response.blob();

  return URL.createObjectURL(blob);
}

export async function loadAttachmentImageNative(
  chatId: number,
  attachment: AttachmentData,
  token: string,
): Promise<File> {
  const fileName =
    attachment.originalName.replace(/[\\/]/g, '_') ||
    'image';

  const destination = new File(
    Paths.cache,
    `voxa-image-${chatId}-${attachment.id}-${Date.now()}-${fileName}`,
  );

  const downloadUrl =
    `${API_BASE_URL}/chats/${chatId}` +
    `/attachments/${attachment.id}/download`;

  try {
    return await File.downloadFileAsync(
      downloadUrl,
      destination,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error) {

    if (destination.exists) {
      destination.delete();
    }

    throw error;
  }
}

export async function uploadVoiceAttachment(
  chatId: number,
  uri: string,
  token: string,
): Promise<AttachmentData> {
  if (Platform.OS !== 'web') {
    return uploadNativeAttachment(
      chatId,
      uri,
      'voice-message.m4a',
      'audio/mp4',
      token,
    );
  }

  const voiceResponse = await fetch(uri);

  if (!voiceResponse.ok) {
    throw new Error(
      'Failed to read recorded voice message',
    );
  }

  const voiceBlob = await voiceResponse.blob();

  const formData = new FormData();

  formData.append(
    'file',
    voiceBlob,
    'voice-message.webm',
  );

  const response = await fetch(
    `${API_BASE_URL}/chats/${chatId}/attachments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Failed to upload voice attachment: ` +
      `${response.status} ${errorBody}`,
    );
  }

  return (await response.json()) as AttachmentData;
}

export async function loadAttachmentAudioWeb(
  chatId: number,
  attachment: AttachmentData,
  token: string,
): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/chats/${chatId}/attachments/${attachment.id}/download`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load audio: HTTP ${response.status}`,
    );
  }

  const blob = await response.blob();

  return URL.createObjectURL(blob);
}

export async function loadAttachmentAudioNative(
  chatId: number,
  attachment: AttachmentData,
  token: string,
): Promise<File> {
  const fileName =
    attachment.originalName.replace(/[\\/]/g, '_') ||
    'voice-message';

  const destination = new File(
    Paths.cache,
    `voxa-audio-${chatId}-${attachment.id}-${Date.now()}-${fileName}`,
  );

  const downloadUrl =
    `${API_BASE_URL}/chats/${chatId}` +
    `/attachments/${attachment.id}/download`;

  try {
    return await File.downloadFileAsync(
      downloadUrl,
      destination,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error) {
    if (destination.exists) {
      destination.delete();
    }

    throw error;
  }
}