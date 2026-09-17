import type { AttachmentData } from '@/types/message';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { API_BASE_URL } from '../config/api';

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
        uri: asset.file,
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