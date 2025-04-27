export interface FoodListing {
    id?: string;
    title: string;
    description: string;
    category: FoodCategory;
    images: string[];
    quantity: number;
    unit: string;
    expiryDate: Date;
    createdAt: Date;
    updatedAt: Date;
    donorId: string;
    donorName: string;
    donorPhoto?: string;
    status: 'available' | 'claimed' | 'completed' | 'expired';
    address: string;
    latitude: number;
    longitude: number;
    claimedBy?: string;
    claimedAt?: Date;
    allergensInfo?: string[];
    dietaryInfo?: string[];
    pickupInstructions?: string;
  }
  export type FoodCategory = 
  'produce' | 
  'bakery' | 
  'dairy' | 
  'meat' | 
  'prepared' | 
  'pantry' | 
  'beverages' | 
  'other';
  