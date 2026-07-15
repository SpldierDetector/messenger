import type { MessageData } from '@/types/message';

export const messages: MessageData[] = [
  {
    id: 1,
    chatId: 1,
    author: 'Alex',
    text: 'Привет! Как дела?',
    time: '20:15',
    createdAt: Date.now(),
    isOwn: false,
  },

  {
    id: 2,
    chatId: 1,
    author: 'Me',
    text: 'Привет! Всё отлично.',
    time: '20:16',
    createdAt: Date.now(),
    isOwn: true,
  },

  {
    id: 3,
    chatId: 1,
    author: 'Alex',
    text: 'Продолжаем делать мессенджер?',
    time: '20:17',
    createdAt: Date.now(),
    isOwn: false,
  },

  {
    id: 4,
    chatId: 2,
    author: 'John',
    text: 'До завтра?',
    time: '18:40',
    createdAt: Date.now(),
    isOwn: false,
  },

  {
    id: 5,
    chatId: 2,
    author: 'Me',
    text: 'Да, увидимся завтра.',
    time: '18:42',
    createdAt: Date.now(),
    isOwn: true,
  },

  {
    id: 6,
    chatId: 3,
    author: 'Maria',
    text: 'Хорошо, договорились',
    time: '16:05',
    createdAt: Date.now(),
    isOwn: false,
  },
  
  {
    id: 7,
    chatId: 3,
    author: 'Me',
    text: 'Отлично, тогда так и сделаем.',
    time: '16:06',
    createdAt: Date.now(),
    isOwn: true,
  },
];