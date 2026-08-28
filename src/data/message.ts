import type { MessageData } from '@/types/message';

export const messages: MessageData[] = [
  {
    id: 1,
    chatId: 1,
    senderId: 2,
    author: 'Alex',
    text: 'Привет! Как дела?',
    createdAt: Date.now(),
    isOwn: false,
    editedAt: null,
  },

  {
    id: 2,
    chatId: 1,
    senderId: 1,
    author: 'Me',
    text: 'Привет! Всё отлично.',
    createdAt: Date.now(),
    isOwn: true,
    editedAt: null,
  },

  {
    id: 3,
    chatId: 1,
    senderId: 2,
    author: 'Alex',
    text: 'Продолжаем делать мессенджер?',
    createdAt: Date.now(),
    isOwn: false,
    editedAt: null,
  },

  {
    id: 4,
    chatId: 2,
    senderId: 3,
    author: 'John',
    text: 'До завтра?',
    createdAt: Date.now(),
    isOwn: false,
    editedAt: null,
  },

  {
    id: 5,
    chatId: 2,
    senderId: 1,
    author: 'Me',
    text: 'Да, увидимся завтра.',
    createdAt: Date.now(),
    isOwn: true,
    editedAt: null,
  },

  {
    id: 6,
    chatId: 3,
    senderId: 4,
    author: 'Maria',
    text: 'Хорошо, договорились',
    createdAt: Date.now(),
    isOwn: false,
    editedAt: null,
  },
  
  {
    id: 7,
    chatId: 3,
    senderId: 1,
    author: 'Me',
    text: 'Отлично, тогда так и сделаем.',
    createdAt: Date.now(),
    isOwn: true,
    editedAt: null,
  },
];