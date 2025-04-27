export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    phoneNumber?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    userType: 'donor' | 'recipient' | 'both';
    createdAt: Date;
    bio?: string;
    ratings?: number;
    ratingCount?: number;
  }