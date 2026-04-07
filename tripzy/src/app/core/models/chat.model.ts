export type MessageType = 'text' | 'image' | 'system';
export type ChatType = 'direct' | 'group';

export interface Chat {
  id: string;
  type: ChatType;
  tripId: string | null; // null for direct messages
  participantIds: string[];
  participantNames: Record<string, string>; // uid -> name
  lastMessage: string;
  lastMessageAt: Date;
  lastMessageSenderId: string;
  unreadCount: Record<string, number>; // uid -> count
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string | null;
  content: string;
  type: MessageType;
  mediaURL: string | null;
  createdAt: Date;
  readBy: string[];
}
