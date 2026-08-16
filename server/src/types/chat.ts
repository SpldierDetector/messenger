export type ChatType =
  | 'direct'
  | 'group';

export type ChatRow = {
  id: number;
  name: string;
  isOnline: number;
  type: ChatType;
};

export type ChatData = {
  id: number;
  name: string;
  isOnline: boolean;
  type: ChatType;
};