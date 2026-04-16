// Centralised query key factory — keeps invalidations consistent across the app.

export const queryKeys = {
  // Auth / profile
  profile: ['profile'] as const,

  // My (authenticated user) resources
  myListings: (cursor?: string) => ['myListings', cursor ?? ''] as const,
  myAppointments: (cursor?: string) => ['myAppointments', cursor ?? ''] as const,
  myContactRequests: (cursor?: string) => ['myContactRequests', cursor ?? ''] as const,
  myReceivedContactRequests: (cursor?: string) => ['myReceivedContactRequests', cursor ?? ''] as const,
  myRatings: (cursor?: string) => ['myRatings', cursor ?? ''] as const,
  myFavorites: (cursor?: string) => ['myFavorites', cursor ?? ''] as const,

  // Public listing resources
  listing: (id: string) => ['listing', id] as const,
  listingComments: (id: string, cursor?: string) => ['comments', id, cursor ?? ''] as const,
  listingRatingSummary: (id: string) => ['ratingSummary', id] as const,
  listingStats: (id: string) => ['listingStats', id] as const,
  listingPriceHistory: (id: string) => ['priceHistory', id] as const,

  // Categories
  categories: ['categories'] as const,
} as const;
