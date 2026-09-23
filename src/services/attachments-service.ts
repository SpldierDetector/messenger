import type { AttachmentData } from '@/types/message';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { API_BASE_URL } from '../config/api';
import {
  Directory,
  File,
  Paths,
} from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function uploadAttachment(
  chatId:number,
  asset: DocumentPickerAsset,
  token: string,
): Promise<AttachmentData> {
  const formData = new FormData();

  if (asset.file) {
    formData.append('file', asset.file, asset.name);
  } else {
    formData.append(
      'file',
      {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/octet-stream',
      } as unknown as Blob,
    );
  }

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
      `Failed to upload attachment: ${response.status} ${errorBody}`,
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

  const downloadedFile =
    await File.downloadFileAsync(
      downloadUrl,
      destination,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

  await Sharing.shareAsync(
    downloadedFile.uri,
    {
      mimeType: attachment.mimeType,
      dialogTitle: 'Сщхранить или поделиться файлом',
    },
  );
}