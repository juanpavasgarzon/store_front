export interface FavoriteResponse {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
  listing?: import('./listings').ListingResponse;
}
