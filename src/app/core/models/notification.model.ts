export interface Notification {
    id?: string;
    recipientId: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    type: 'new-listing' | 'claim-request' | 'claim-accepted' | 'message' | 'expiry-reminder' | 'system';
    relatedItemId?: string; // Can be a listing ID or message ID
    senderId?: string;
  }