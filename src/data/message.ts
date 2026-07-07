import type { MessageData } from '@/types/message'

export const messages: MessageData[] = [
  {
    id: 1,
    author: 'Alex',
    text: 'Привет! Как дела?',
    time: '20:15',
    isOwn: false,
  },
  {
    id: 2,
    author: 'Me',
    text: 'Привет! Всё отлично.',
    time: '20:16',
    isOwn: true,
  },
  {
    id: 3,
    author: 'Alex',
    text: 'Продолжаем делать мессенджер?',
    time: '20:17',
    isOwn: false,
  },
];