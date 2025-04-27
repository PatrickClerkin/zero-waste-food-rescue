// src/app/core/services/food-listing.service.ts
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
  limit,
  DocumentReference,
  addDoc,
  getDoc,
  getDocs
} from '@angular/fire/firestore';
import { 
  Storage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from '@angular/fire/storage';
import { Observable, from, map, switchMap } from 'rxjs';
import { FoodListing, FoodCategory } from '../models/food-listing.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FoodListingService {
  private firestore: Firestore = inject(Firestore);
  private storage: Storage = inject(Storage);
  private authService = inject(AuthService);

  constructor() {}

  // Create a new food listing
  async createListing(listing: Omit<FoodListing, 'id' | 'createdAt' | 'updatedAt' | 'donorId' | 'donorName' | 'donorPhoto' | 'status'>, images: File[]): Promise<string> {
    try {
      const currentUser = await this.authService.currentUser$.pipe(
        map(user => {
          if (!user) throw new Error('User not authenticated');
          return user;
        })
      ).toPromise();

      // Upload images first
      const imageUrls = await this.uploadListingImages(images);
      
      // Create listing with user and timestamp data
      const newListing: FoodListing = {
        ...listing,
        images: imageUrls,
        createdAt: new Date(),
        updatedAt: new Date(),
        donorId: currentUser!.uid,
        donorName: currentUser!.displayName,
        donorPhoto: currentUser!.photoURL,
        status: 'available',
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(this.firestore, 'foodListings'), newListing);
      
      // Update with ID
      await updateDoc(docRef, { id: docRef.id });
      
      return docRef.id;
    } catch (error) {
      console.error('Create listing error:', error);
      throw error;
    }
  }

  // Upload listing images to Firebase Storage
  private async uploadListingImages(images: File[]): Promise<string[]> {
    const urls: string[] = [];
    
    for (const image of images) {
      const timestamp = new Date().getTime();
      const path = `listings/${timestamp}_${image.name}`;
      const storageRef = ref(this.storage, path);
      
      const uploadTask = uploadBytesResumable(storageRef, image);
      
      // Wait for upload to complete
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Handle progress if needed
          },
          (error) => {
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            urls.push(downloadURL);
            resolve();
          }
        );
      });
    }
    
    return urls;
  }

  // Get all available food listings
  getAvailableListings(): Observable<FoodListing[]> {
    const listingsQuery = query(
      collection(this.firestore, 'foodListings'),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc')
    );
    
    return collectionData(listingsQuery) as Observable<FoodListing[]>;
  }

  // Get food listings by category
  getListingsByCategory(category: FoodCategory): Observable<FoodListing[]> {
    const listingsQuery = query(
      collection(this.firestore, 'foodListings'),
      where('status', '==', 'available'),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    
    return collectionData(listingsQuery) as Observable<FoodListing[]>;
  }

  // Get listings by distance (requires GeoFirestore or similar)
  async getListingsByDistance(lat: number, lng: number, radiusInKm: number): Promise<FoodListing[]> {
    // For simplicity, we'll get all listings and filter by distance
    // In a production app, you'd use Geohashing or a specialized solution
    const listingsQuery = query(
      collection(this.firestore, 'foodListings'),
      where('status', '==', 'available')
    );
    
    const querySnapshot = await getDocs(listingsQuery);
    const listings: FoodListing[] = [];
    
    querySnapshot.forEach(doc => {
      const listing = doc.data() as FoodListing;
      const distance = this.calculateDistance(
        lat, lng,
        listing.latitude, listing.longitude
      );
      
      if (distance <= radiusInKm) {
        listings.push(listing);
      }
    });
    
    // Sort by distance
    return listings.sort((a, b) => {
      const distA = this.calculateDistance(lat, lng, a.latitude, a.longitude);
      const distB = this.calculateDistance(lat, lng, b.latitude, b.longitude);
      return distA - distB;
    });
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get a single listing by ID
  async getListing(id: string): Promise<FoodListing | null> {
    try {
      const docRef = doc(this.firestore, 'foodListings', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as FoodListing;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Get listing error:', error);
      throw error;
    }
  }

  // Update an existing listing
  async updateListing(id: string, listingData: Partial<FoodListing>, newImages?: File[]): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'foodListings', id);
      
      // Handle image uploads if there are new images
      if (newImages && newImages.length > 0) {
        const imageUrls = await this.uploadListingImages(newImages);
        
        // If we want to append to existing images
        if (listingData.images) {
          listingData.images = [...listingData.images, ...imageUrls];
        } else {
          // Get current listing to append to existing images
          const currentListing = await this.getListing(id);
          if (currentListing) {
            listingData.images = [...currentListing.images, ...imageUrls];
          } else {
            listingData.images = imageUrls;
          }
        }
      }
      
      // Always update the updatedAt field
      listingData.updatedAt = new Date();
      
      await updateDoc(docRef, listingData);
    } catch (error) {
      console.error('Update listing error:', error);
      throw error;
    }
  }

  // Delete a listing
  async deleteListing(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, 'foodListings', id));
    } catch (error) {
      console.error('Delete listing error:', error);
      throw error;
    }
  }

  // Claim a food listing
  async claimListing(listingId: string): Promise<void> {
    try {
      const currentUser = await this.authService.currentUser$.pipe(
        map(user => {
          if (!user) throw new Error('User not authenticated');
          return user;
        })
      ).toPromise();
      
      const listingRef = doc(this.firestore, 'foodListings', listingId);
      
      await updateDoc(listingRef, {
        status: 'claimed',
        claimedBy: currentUser!.uid,
        claimedAt: new Date()
      });
    } catch (error) {
      console.error('Claim listing error:', error);
      throw error;
    }
  }

  // Get listings by donor
  getListingsByDonor(donorId: string): Observable<FoodListing[]> {
    const listingsQuery = query(
      collection(this.firestore, 'foodListings'),
      where('donorId', '==', donorId),
      orderBy('createdAt', 'desc')
    );
    
    return collectionData(listingsQuery) as Observable<FoodListing[]>;
  }

  // Get claimed listings by user
  getClaimedListings(userId: string): Observable<FoodListing[]> {
    const listingsQuery = query(
      collection(this.firestore, 'foodListings'),
      where('claimedBy', '==', userId),
      orderBy('claimedAt', 'desc')
    );
    
    return collectionData(listingsQuery) as Observable<FoodListing[]>;
  }
}
