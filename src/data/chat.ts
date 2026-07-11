import type { ChatData } from '@/types/chat';

export const chats: ChatData[] = [
    {
        id: 1,
        name: 'Alex',
        lastMessage: 'Продолжаем делать мессенджер?',
        time: '20:17',
        isOnline: true,
    },
    {
        id: 2,
        name: 'John',
        lastMessage: 'До завтра',
        time: '18:42',
        isOnline: false,
    },
    {
        id: 3,
        name: 'Maria',
        lastMessage: 'Хорошо, договорились',
        time: '16:05',
        isOnline: true,
    },
]