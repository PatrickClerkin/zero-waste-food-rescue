// src/app/core/services/messaging.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  addDoc,
  getDocs,
  limit as firestoreLimit
} from '@angular/fire/firestore';
import { Observable, combineLatest, firstValueFrom } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  constructor() {}

  // Send a message
  async sendMessage(recipientId: string, content: string, listingId?: string): Promise<string> {
    try {
      const currentUser = await firstValueFrom(this.authService.currentUser$);
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const newMessage: Message = {
        senderId: currentUser.uid,
        recipientId,
        content,
        createdAt: new Date(),
        isRead: false,
        listingId
      };
      
      const docRef = await addDoc(collection(this.firestore, 'messages'), newMessage);
      
      // Create notification for recipient
      await this.notificationService.createNotification({
        recipientId,
        title: 'New Message',
        message: `New message from ${currentUser.displayName}`,
        type: 'message',
        relatedItemId: docRef.id,
        senderId: currentUser.uid,
        isRead: false 
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  // Get conversation with a specific user
  getConversation(otherUserId: string): Observable<Message[]> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(currentUser => {
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        return currentUser;
      }),
      switchMap(currentUser => {
        const sentQuery = query(
          collection(this.firestore, 'messages'),
          where('senderId', '==', currentUser.uid),
          where('recipientId', '==', otherUserId),
          orderBy('createdAt', 'asc')
        );
        
        const receivedQuery = query(
          collection(this.firestore, 'messages'),
          where('senderId', '==', otherUserId),
          where('recipientId', '==', currentUser.uid),
          orderBy('createdAt', 'asc')
        );
        
        const sent$ = collectionData(sentQuery) as Observable<Message[]>;
        const received$ = collectionData(receivedQuery) as Observable<Message[]>;
        
        return combineLatest([sent$, received$]).pipe(
          map(([sent, received]) => {
            const allMessages = [...sent, ...received];
            return allMessages.sort((a, b) => {
              const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
              const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
              return aTime - bTime;
            });
          })
        );
      })
    );
  }

  // Mark message as read
  async markAsRead(messageId: string): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, 'messages', messageId), {
        isRead: true
      });
    } catch (error) {
      console.error('Mark message as read error:', error);
      throw error;
    }
  }

  // Get all conversations for current user
  async getConversations(): Promise<any[]> {
    try {
      const currentUser = await firstValueFrom(this.authService.currentUser$);
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Get messages where user is sender or recipient
      const sentQuery = query(
        collection(this.firestore, 'messages'),
        where('senderId', '==', currentUser.uid)
      );
      
      const receivedQuery = query(
        collection(this.firestore, 'messages'),
        where('recipientId', '==', currentUser.uid)
      );
      
      const sentSnapshots = await getDocs(sentQuery);
      const receivedSnapshots = await getDocs(receivedQuery);
      
      // Extract unique user IDs from conversations
      const userIds = new Set<string>();
      
      sentSnapshots.forEach(doc => {
        const message = doc.data() as Message;
        userIds.add(message.recipientId);
      });
      
      receivedSnapshots.forEach(doc => {
        const message = doc.data() as Message;
        userIds.add(message.senderId);
      });
      
      // Get user data for each conversation partner
      const conversations = [];
      
      for (const userId of userIds) {
        const userData = await this.authService.getUserData(userId);
        
        if (userData) {
          // Get latest message
          const latestMessageQuery = query(
            collection(this.firestore, 'messages'),
            where('senderId', 'in', [currentUser.uid, userId]),
            where('recipientId', 'in', [currentUser.uid, userId]),
            orderBy('createdAt', 'desc'),
            firestoreLimit(1)
          );
          
          const latestMessageSnapshot = await getDocs(latestMessageQuery);
          let latestMessage = null;
          
          if (!latestMessageSnapshot.empty) {
            latestMessage = latestMessageSnapshot.docs[0].data() as Message;
          }
          
          // Count unread messages
          const unreadQuery = query(
            collection(this.firestore, 'messages'),
            where('senderId', '==', userId),
            where('recipientId', '==', currentUser.uid),
            where('isRead', '==', false)
          );
          
          const unreadSnapshot = await getDocs(unreadQuery);
          const unreadCount = unreadSnapshot.size;
          
          conversations.push({
            user: userData,
            latestMessage,
            unreadCount
          });
        }
      }
      
      // Sort by latest message time
      return conversations.sort((a, b) => {
        if (!a.latestMessage) return 1;
        if (!b.latestMessage) return -1;
        
        const aTime = a.latestMessage.createdAt instanceof Date ? 
          a.latestMessage.createdAt.getTime() : 
          new Date(a.latestMessage.createdAt).getTime();
        
        const bTime = b.latestMessage.createdAt instanceof Date ? 
          b.latestMessage.createdAt.getTime() : 
          new Date(b.latestMessage.createdAt).getTime();
        
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }
}