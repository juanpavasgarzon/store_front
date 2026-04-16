// Comments
export interface CommentResponse {
  id: string;
  userId: string;
  listingId: string;
  content: string;
  userName?: string;
  createdAt: string;
}

// Ratings
export interface RatingResponse {
  id: string;
  userId: string;
  listingId: string;
  score: number;
  createdAt: string;
}

/** API returns { avg, count } — not { average, count } */
export interface RatingSummaryResponse {
  avg: number;
  count: number;
}

// Favorites
export interface FavoriteResponse {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
  listing?: import('./listings').ListingResponse;
}

export interface FavoriteCollectionResponse {
  id: string;
  name: string;
  createdAt: string;
}
