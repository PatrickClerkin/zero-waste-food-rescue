// src/app/features/messaging/conversation-list/conversation-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { MessagingService } from '../../../core/services/messaging.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, TimeAgoPipe],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Messages</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refreshConversations($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading conversations...</p>
      </div>
      
      <ion-list *ngIf="!isLoading">
        <div *ngIf="conversations.length === 0" class="empty-state">
          <ion-icon name="chatbubble-outline" class="empty-icon"></ion-icon>
          <h2>No Messages</h2>
          <p>You don't have any conversations yet.</p>
        </div>
        
        <ion-item
          *ngFor="let conversation of conversations"
          [routerLink]="['/messages', conversation.user.uid]"
          button
          detail
          [class.unread]="conversation.unreadCount > 0"
        >
          <ion-avatar slot="start">
            <img [src]="conversation.user.photoURL || 'assets/images/avatar-placeholder.jpg'" [alt]="conversation.user.displayName">
          </ion-avatar>
          
          <ion-label>
            <h2>{{ conversation.user.displayName }}</h2>
            <p *ngIf="conversation.latestMessage">
              {{ conversation.latestMessage.content | slice:0:50 }}{{ conversation.latestMessage.content.length > 50 ? '...' : '' }}
            </p>
          </ion-label>
          
          <div class="conversation-meta" slot="end">
            <span class="time" *ngIf="conversation.latestMessage">
              {{ conversation.latestMessage.createdAt | timeAgo }}
            </span>
            
            <ion-badge 
              *ngIf="conversation.unreadCount > 0" 
              color="primary"
              class="unread-badge"
            >
              {{ conversation.unreadCount }}
            </ion-badge>
          </div>
        </ion-item>
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
    
    .unread {
      --background: rgba(var(--ion-color-primary-rgb), 0.1);
      font-weight: 500;
    }
    
    .conversation-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    
    .time {
      font-size: 12px;
      color: var(--ion-color-medium);
    }
    
    .unread-badge {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 10px;
    }
  `]
})
export class ConversationListComponent implements OnInit {
  conversations: any[] = [];
  isLoading = true;
  
  constructor(private messagingService: MessagingService) {}
  
  ngOnInit(): void {
    this.loadConversations();
  }
  
  async loadConversations(): Promise<void> {
    this.isLoading = true;
    
    try {
      this.conversations = await this.messagingService.getConversations();
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading conversations:', error);
      this.isLoading = false;
    }
  }
  
  refreshConversations(event: any): void {
    this.loadConversations().then(() => {
      event.target.complete();
    });
  }
}