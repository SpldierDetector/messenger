import type { MessageData } from '@/types/message';

export type SendMessageRequest = {
    chatId: number;
    text: string;
};

export type SendMessageResponse = MessageData;

export type MessageApiData = {
    id: number;
    chatId: number;
    senderId: number;
    author: string;
    text: string;
    createdAt: number;
    editedAt: number | null;
    deletedAt: number | null;
};

export type EditMessageRequest = {
    text: string;
};