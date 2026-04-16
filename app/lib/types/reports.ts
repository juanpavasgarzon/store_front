export type ReportReason =
  | 'spam'
  | 'fraud'
  | 'inappropriate'
  | 'duplicate'
  | 'wrong_category'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'action_taken';

export interface ReportResponse {
  id: string;
  userId: string;
  listingId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}
