// src/app/core/services/notification.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  addDoc,
  getDocs as firestoreGetDocs
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Notification } from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);

  constructor() {}

  // Create a notification
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const newNotification: Notification = {
        ...notification,
        createdAt: new Date(),
        isRead: false
      };
      
      const docRef = await addDoc(collection(this.firestore, 'notifications'), newNotification);
      
      return docRef.id;
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  // Get notifications for current user
  getUserNotifications(): Observable<Notification[]> {
    const currentUser = this.authService.currentUser$.getValue();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const notificationsQuery = query(
      collection(this.firestore, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    return collectionData(notificationsQuery) as Observable<Notification[]>;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, 'notifications', notificationId), {
        isRead: true
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, 'notifications', notificationId));
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }

  // Create system notifications for new listings that match user preferences
  // This would be called by a Cloud Function in production
  async notifyUsersOfNewListing(listingId: string, title: string, category: string): Promise<void> {
    // In a real app, this would be handled by a Cloud Function
    // This is a simplified implementation
    
    // Get users who are interested in this category
    // For simplicity, we're notifying all recipients
    const usersQuery = query(
      collection(this.firestore, 'users'),
      where('userType', 'in', ['recipient', 'both'])
    );
    
    const snapshot = await firestoreGetDocs(usersQuery);
    
    snapshot.forEach(async (userDoc) => {
      const user = userDoc.data();
      
      // Create notification for this user
      await this.createNotification({
        recipientId: user.uid,
        title: 'New Food Available',
        message: `New ${category} listing: ${title}`,
        type: 'new-listing',
        relatedItemId: listingId,
        isRead: false
      });
    });
  }
}