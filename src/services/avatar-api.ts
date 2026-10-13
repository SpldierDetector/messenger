import type {
  DocumentPickerAsset,
} from 'expo-document-picker';
import type {
  UpdateProfileResponse,
} from '@/types/auth';
import { API_BASE_URL } from '@/config/api';
import { ApiError } from '@/services/api-error';
import { Platform } from 'react-native';
import { File, UploadType } from 'expo-file-system';

export async function uploadAvatarRequest(
  token: string,
  asset: DocumentPickerAsset,
): Promise<UpdateProfileResponse> {
  const url = `${API_BASE_URL}/users/me/avatar`;

  if (Platform.OS !== 'web') {
    const file = new File(asset.uri);

    const result = await file.upload(url, {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      fieldName: 'file',
      mimeType: asset.mimeType,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (result.status < 200 || result.status >= 300) {
      console.error(
        'Avatar upload HTTP error:',
        result.status,
        result.body,
      );

      throw new ApiError(
        'Failed to upload avatar',
        result.status,
      );
    }

    return JSON.parse(
      result.body,
    ) as UpdateProfileResponse;
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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(
      'Failed to upload avatar',
      response.status,
    );
  }

  return (await response.json()) as UpdateProfileResponse;
}

export async function deleteAvatarRequest(
  token: string,
): Promise<UpdateProfileResponse> {
  const response = await fetch(
    `${API_BASE_URL}/users/me/avatar`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new ApiError(
      'Failed to delete avatar',
      response.status,
    );
  }

  return response.json();
}