import type {
  AttachmentData,
  MessageData,
} from '@/types/message';

function getAttachmentPreview(
  attachments: AttachmentData[],
): string {
  if (attachments.length === 0) {
    return '';
  }

  if (attachments.length > 1) {
    if (attachments.every(
      (attachment) => attachment.type === 'image',
    )) {
      return `🖼️ Фото: ${attachments.length}`;
    }

    return `📎 Вложений: ${attachments.length}`;
  }

  const attachment = attachments[0];

  switch (attachment.type) {
    case 'image':
      return '🖼️ Фото';

    case 'audio':
      return '🎤 Голосовое сообщение';

    case 'file':
      return `📎 ${attachment.originalName}`;
  }
}

export function getReplyPreviewText(
  message: Pick<MessageData, 'text' | 'attachments'>,
): string {
  const text = message.text.trim();
  const attachmentPreview = getAttachmentPreview(message.attachments);

  if (text && attachmentPreview) {
    return `${attachmentPreview} . ${text}`;
  }

  return (
    attachmentPreview ||
    text ||
    'Сообщение без текста'
  );
}