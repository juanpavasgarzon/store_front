export type ListingStatus =
  | 'draft'
  | 'active'
  | 'reserved'
  | 'sold'
  | 'expired'
  | 'suspended';

export interface ListingPhoto {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
}

export interface ListingSeller {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
}

export interface ListingAttributeValue {
  id: string;
  attributeId: string;
  attributeName: string;
  attributeKey: string;
  valueType: string;
  value: string;
}

export interface ListingResponse {
  id: string;
  code: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  location: string;
  city: string | null;
  sector: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ListingStatus;
  expiresAt: string | null;
  isActive: boolean;
  isBoosted: boolean;
  boostedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string | null;
    name: string | null;
    slug: string | null;
  };
  seller?: ListingSeller;
  photos?: ListingPhoto[];
  attributeValues?: ListingAttributeValue[];
}

export interface ListingStatsResponse {
  listingId: string;
  totalViews: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  uniqueViewers: number;
  favoritesCount: number;
  contactRequestsCount: number;
}
