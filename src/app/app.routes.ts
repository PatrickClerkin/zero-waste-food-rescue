// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, donorGuard, recipientGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'food-listings',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'food-listings',
    loadComponent: () => import('./features/food-listings/listing-list/listing-list.component').then(m => m.ListingListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'food-listings/create',
    loadComponent: () => import('./features/food-listings/listing-create/listing-create.component').then(m => m.ListingCreateComponent),
    canActivate: [donorGuard]
  },
  {
    path: 'food-listings/:id',
    loadComponent: () => import('./features/food-listings/listing-detail/listing-detail.component').then(m => m.ListingDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'food-listings/edit/:id',
    loadComponent: () => import('./features/food-listings/listing-edit/listing-edit.component').then(m => m.ListingEditComponent),
    canActivate: [donorGuard]
  },
  {
    path: 'map',
    loadComponent: () => import('./features/map/map-page/map-page.component').then(m => m.MapPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile-view/profile-view.component').then(m => m.ProfileViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('./features/profile/profile-edit/profile-edit.component').then(m => m.ProfileEditComponent),
    canActivate: [authGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notification-list/notification-list.component').then(m => m.NotificationListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'messages',
    loadComponent: () => import('./features/messaging/conversation-list/conversation-list.component').then(m => m.ConversationListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'messages/:id',
    loadComponent: () => import('./features/messaging/conversation/conversation.component').then(m => m.ConversationComponent),
    canActivate: [authGuard]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/errors/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./features/errors/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];