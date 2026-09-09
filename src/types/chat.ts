export type ChatType =
  | 'direct'
  | 'group';

export type ChatData = {
  id: number;
  name: string;
  isOnline: boolean;
  lastSeenAt: number | null;
  type: ChatType;
};