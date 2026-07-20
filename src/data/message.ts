import type { MessageData } from '@/types/message';

export const messages: MessageData[] = [
  {
    id: 1,
    chatId: 1,
    author: 'Alex',
    text: 'Привет! Как дела?',
    createdAt: Date.now(),
    isOwn: false,
  },

  {
    id: 2,
    chatId: 1,
    author: 'Me',
    text: 'Привет! Всё отлично.',
    createdAt: Date.now(),
    isOwn: true,
  },

  {
    id: 3,
    chatId: 1,
    author: 'Alex',
    text: 'Продолжаем делать мессенджер?',
    createdAt: Date.now(),
    isOwn: false,
  },

  {
    id: 4,
    chatId: 2,
    author: 'John',
    text: 'До завтра?',
    createdAt: Date.now(),
    isOwn: false,
  },

  {
    id: 5,
    chatId: 2,
    author: 'Me',
    text: 'Да, увидимся завтра.',
    createdAt: Date.now(),
    isOwn: true,
  },

  {
    id: 6,
    chatId: 3,
    author: 'Maria',
    text: 'Хорошо, договорились',
    createdAt: Date.now(),
    isOwn: false,
  },
  
  {
    id: 7,
    chatId: 3,
    author: 'Me',
    text: 'Отлично, тогда так и сделаем.',
    createdAt: Date.now(),
    isOwn: true,
  },
];