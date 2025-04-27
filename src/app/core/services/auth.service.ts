// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile, 
  UserCredential, 
  user, 
  onAuthStateChanged 
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, of, switchMap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        this.getUserData(firebaseUser.uid).then(userData => {
          this.currentUserSubject.next(userData);
        });
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      const userData = await this.getUserData(result.user.uid);
      this.currentUserSubject.next(userData);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(email: string, password: string, displayName: string, userType: 'donor' | 'recipient' | 'both'): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, { displayName });
      
      // Create user document in Firestore
      const userData: User = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName,
        userType,
        createdAt: new Date(),
        ratings: 0,
        ratingCount: 0
      };
      
      await setDoc(doc(this.firestore, 'users', result.user.uid), userData);
      this.currentUserSubject.next(userData);
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      return await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  }

  async updateUserProfile(user: Partial<User>): Promise<void> {
    try {
      const currentUser = this.currentUserSubject.getValue();
      if (!currentUser) throw new Error('No authenticated user');
      
      await updateDoc(doc(this.firestore, 'users', currentUser.uid), { ...user });
      
      // Update local user object
      this.currentUserSubject.next({ ...currentUser, ...user });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.getValue();
  }

  isDonor(): boolean {
    const user = this.currentUserSubject.getValue();
    return user?.userType === 'donor' || user?.userType === 'both';
  }

  isRecipient(): boolean {
    const user = this.currentUserSubject.getValue();
    return user?.userType === 'recipient' || user?.userType === 'both';
  }
}