import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { Notification } from '../../../core/models/notification.model';
import { TimeAgoPipe } from 'src/app/shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, TimeAgoPipe],
  template: `
    <ion-item 
      [detail]="true" 
      [routerLink]="getNotificationRoute(notification)"
      (click)="markAsRead()"
      [class.unread]="!notification.isRead"
    >
      <ion-icon 
        [name]="getNotificationIcon(notification.type)" 
        slot="start" 
        [color]="!notification.isRead ? 'primary' : 'medium'"
      ></ion-icon>
      
      <ion-label>
        <h2>{{ notification.title }}</h2>
        <p>{{ notification.message }}</p>
        <p class="notification-time">{{ notification.createdAt | timeAgo }}</p>
      </ion-label>
      
      <ion-button 
        fill="clear" 
        slot="end" 
        (click)="$event.stopPropagation(); onDelete()"
      >
        <ion-icon name="trash-outline" color="danger"></ion-icon>
      </ion-button>
    </ion-item>
  `,
  styles: [`
    .unread {
      --background: rgba(var(--ion-color-primary-rgb), 0.1);
    }
    
    .notification-time {
      font-size: 12px;
      color: var(--ion-color-medium);
    }
  `]
})
export class NotificationItemComponent {
  @Input() notification!: Notification;
  
  @Output() read = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'new-listing': return 'basket';
      case 'claim-request': return 'hand-left';
      case 'claim-accepted': return 'checkmark-circle';
      case 'message': return 'chatbubble';
      case 'expiry-reminder': return 'alarm';
      case 'system': return 'information-circle';
      default: return 'notifications';
    }
  }
  
  getNotificationRoute(notification: Notification): string[] {
    switch (notification.type) {
      case 'new-listing':
      case 'claim-request':
      case 'claim-accepted':
        return notification.relatedItemId ? ['/food-listings', notification.relatedItemId] : ['/food-listings'];
      case 'message':
        return notification.senderId ? ['/messages', notification.senderId] : ['/messages'];
      default:
        return ['/notifications'];
    }
  }
  
  markAsRead(): void {
    if (!this.notification.isRead && this.notification.id) {
      this.read.emit(this.notification.id);
    }
  }
  
  onDelete(): void {
    if (this.notification.id) {
      this.delete.emit(this.notification.id);
    }
  }
}