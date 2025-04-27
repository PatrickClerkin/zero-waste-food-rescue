// src/app/features/notifications/notification-list/notification-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Notification } from '../../../core/models/notification.model';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationItemComponent } from '../../../shared/components/notification-item/notification-item.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, IonicModule, NotificationItemComponent, TimeAgoPipe],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="markAllAsRead()" [disabled]="!hasUnreadNotifications()">
            <ion-icon name="checkmark-done-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refreshNotifications($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading notifications...</p>
      </div>
      
      <ion-list *ngIf="!isLoading">
        <div *ngIf="notifications.length === 0" class="empty-state">
          <ion-icon name="notifications-off-outline" class="empty-icon"></ion-icon>
          <h2>No Notifications</h2>
          <p>You don't have any notifications yet.</p>
        </div>
        
        <app-notification-item
          *ngFor="let notification of notifications"
          [notification]="notification"
          (read)="markAsRead($event)"
          (delete)="deleteNotification($event)"
        ></app-notification-item>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--ion-color-medium);
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
      color: var(--ion-color-medium);
    }
    
    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
  `]
})
export class NotificationListComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  isLoading = true;
  
  private subscriptions = new Subscription();
  
  constructor(private notificationService: NotificationService) {}
  
  ngOnInit(): void {
    this.loadNotifications();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  loadNotifications(): void {
    this.isLoading = true;
    
    this.subscriptions.add(
      this.notificationService.getUserNotifications().subscribe({
        next: (notifications) => {
          // Sort by date (newest first) and then by read status (unread first)
          this.notifications = notifications.sort((a, b) => {
            if (a.isRead !== b.isRead) {
              return a.isRead ? 1 : -1;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.isLoading = false;
        }
      })
    );
  }
  
  hasUnreadNotifications(): boolean {
    return this.notifications.some(notification => !notification.isRead);
  }
  
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.notificationService.markAsRead(notificationId);
      
      // Update local state
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
  
  async markAllAsRead(): Promise<void> {
    try {
      const unreadNotifications = this.notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        if (notification.id) {
          await this.notificationService.markAsRead(notification.id);
          notification.isRead = true;
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
  
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.notificationService.deleteNotification(notificationId);
      
      // Update local state
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }
  
  refreshNotifications(event: any): void {
    this.loadNotifications();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}