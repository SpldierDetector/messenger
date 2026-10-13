export type ChatType =
  | 'direct'
  | 'group';

export type ChatRow = {
  id: number;
  otherUserId: number;
  name: string;
  otherUserLastSeenAt: number | null;
  isOnline: number;
  type: ChatType;
  avatarUrl: string | null;
};

export type ChatData = {
  id: number;
  name: string;
  isOnline: boolean;
  lastSeenAt: number | null;
  type: ChatType;
  avatarUrl: string | null;
};