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

export interface ListingVariant {
  id: string;
  categoryVariantId: string;
  categoryVariantKey: string;
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
  photos?: ListingPhoto[];
  variants?: ListingVariant[];
}

export interface ListingStatsResponse {
  listingId: string;
  totalViews: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  uniqueViewers: number;
  favoritesCount: number;
  averageRating: number;
  ratingsCount: number;
  contactRequestsCount: number;
}

export interface ListingPriceHistory {
  id: string;
  listingId: string;
  price: string;
  changedByUserId: string | null;
  changedAt: string;
}
