import type { MessageData } from '@/types/message';

export type SendMessageRequest = {
    charId: number;
    text: string;
};

export type SendMessageResponse = MessageData;