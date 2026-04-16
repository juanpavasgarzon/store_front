import type { ListingResponse } from './listings';

export interface ContactRequestRequester {
  id: string;
  name: string;
  email: string;
}

export interface ContactRequestResponse {
  id: string;
  userId: string;
  listingId: string;
  message: string | null;
  createdAt: string;
  requester?: ContactRequestRequester;
  listing?: ListingResponse;
}
