import type { MessageData } from '@/types/message';

export type SendMessageRequest = {
    chatId: number;
    text: string;
};

export type SendMessageResponse = MessageData;