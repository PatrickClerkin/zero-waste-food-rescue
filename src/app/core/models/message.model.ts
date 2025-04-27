// src/app/core/models/message.model.ts
export interface Message {
    id?: string;
    senderId: string;
    recipientId: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
    listingId?: string;
  }
  