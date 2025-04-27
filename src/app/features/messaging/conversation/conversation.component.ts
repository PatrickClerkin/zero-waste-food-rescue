// src/app/features/messaging/conversation/conversation.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Message } from '../../../core/models/message.model';
import { User } from '../../../core/models/user.model';
import { MessagingService } from '../../../core/services/messaging.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, TimeAgoPipe],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/messages"></ion-back-button>
        </ion-buttons>
        
        <ion-title *ngIf="otherUser">
          <div class="user-title">
            <ion-avatar>
              <img [src]="otherUser.photoURL || 'assets/images/avatar-placeholder.jpg'" [alt]="otherUser.displayName">
            </ion-avatar>
            <span>{{ otherUser.displayName }}</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content #content>
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading messages...</p>
      </div>
      
      <div *ngIf="!isLoading && messages.length === 0" class="empty-state">
        <ion-icon name="chatbubbles-outline" class="empty-icon"></ion-icon>
        <h2>No Messages Yet</h2>
        <p>Start the conversation by sending a message.</p>
      </div>
      
      <div class="messages-container">
        <div 
          *ngFor="let message of messages" 
          class="message-wrapper"
          [class.sent]="isSentMessage(message)"
          [class.received]="!isSentMessage(message)"
        >
          <div class="message">
            <div class="message-content">{{ message.content }}</div>
            <div class="message-time">
              {{ message.createdAt | timeAgo }}
              <ion-icon 
                *ngIf="isSentMessage(message)" 
                [name]="message.isRead ? 'checkmark-done-outline' : 'checkmark-outline'"
                class="read-status"
              ></ion-icon>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
    
    <ion-footer>
      <ion-toolbar>
        <div class="input-container">
          <ion-textarea
            [formControl]="messageControl"
            placeholder="Type a message..."
            autoGrow="true"
            rows="1"
            class="message-input"
            (keydown.enter)="handleEnterPress($event)"
          ></ion-textarea>
          
          <ion-button 
            fill="clear"
            [disabled]="!messageControl.value?.trim()"
            (click)="sendMessage()"
          >
            <ion-icon name="send" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
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
    
    .user-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .user-title ion-avatar {
      width: 32px;
      height: 32px;
    }
    
    .messages-container {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .message-wrapper {
      display: flex;
      width: 100%;
    }
    
    .message-wrapper.sent {
      justify-content: flex-end;
    }
    
    .message-wrapper.received {
      justify-content: flex-start;
    }
    
    .message {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 16px;
      position: relative;
    }
    
    .sent .message {
      background-color: var(--ion-color-primary);
      color: white;
      border-bottom-right-radius: 4px;
    }
    
    .received .message {
      background-color: var(--ion-color-light);
      color: var(--ion-color-dark);
      border-bottom-left-radius: 4px;
    }
    
    .message-content {
      margin-bottom: 4px;
      white-space: pre-wrap;
    }
    
    .message-time {
      font-size: 11px;
      opacity: 0.7;
      text-align: right;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 4px;
    }
    
    .read-status {
      font-size: 14px;
    }
    
    .input-container {
      display: flex;
      align-items: center;
      padding: 0 8px;
    }
    
    .message-input {
      --padding-top: 8px;
      --padding-bottom: 8px;
      --padding-start: 16px;
      --padding-end: 16px;
      margin: 0;
    }
  `]
})
export class ConversationComponent implements OnInit, OnDestroy {
  @ViewChild('content') private content!: ElementRef;
  
  otherUserId: string = '';
  otherUser: User | null = null;
  currentUser: User | null = null;
  
  messages: Message[] = [];
  isLoading = true;
  
  messageControl = new FormControl('');
  
  private subscriptions = new Subscription();
  
  constructor(
    private route: ActivatedRoute,
    private messagingService: MessagingService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.otherUserId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.otherUserId) {
      return;
    }
    
    // Get current user
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
    
    // Get other user's info
    this.authService.getUserData(this.otherUserId).then(user => {
      this.otherUser = user;
    });
    
    // Load messages
    this.loadMessages();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  loadMessages(): void {
    this.isLoading = true;
    
    this.subscriptions.add(
      this.messagingService.getConversation(this.otherUserId).subscribe({
        next: (messages) => {
          this.messages = messages;
          this.isLoading = false;
          
          // Mark received messages as read
          this.markMessagesAsRead();
          
          // Scroll to bottom
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          this.isLoading = false;
        }
      })
    );
  }
  
  markMessagesAsRead(): void {
    for (const message of this.messages) {
      if (!message.isRead && !this.isSentMessage(message) && message.id) {
        this.messagingService.markAsRead(message.id);
      }
    }
  }
  
  sendMessage(): void {
    const content = this.messageControl.value?.trim();
    
    if (!content || !this.otherUserId) {
      return;
    }
    
    this.messagingService.sendMessage(this.otherUserId, content)
      .then(() => {
        this.messageControl.setValue('');
        this.scrollToBottom();
      })
      .catch(error => {
        console.error('Error sending message:', error);
      });
  }
  
  isSentMessage(message: Message): boolean {
    return this.currentUser?.uid === message.senderId;
  }
  
  // Add this method to handle the event
  handleEnterPress(event: any): void {
    this.onEnterPress(event as KeyboardEvent);
  }
  
  onEnterPress(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
  
  private scrollToBottom(): void {
    if (this.content) {
      this.content.nativeElement.scrollToBottom(300);
    }
  }
}