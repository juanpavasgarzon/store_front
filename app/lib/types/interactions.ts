import type { ListingResponse } from './listings';

// Appointments
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface AppointmentResponse {
  id: string;
  userId: string;
  listingId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  listing?: ListingResponse;
}

// Contact Requests
export type ContactRequestStatus = 'pending' | 'responded' | 'closed';

export interface ContactRequestResponse {
  id: string;
  userId: string;
  listingId: string;
  message: string | null;
  status: ContactRequestStatus;
  respondedAt: string | null;
  createdAt: string;
  listing?: ListingResponse;
}
