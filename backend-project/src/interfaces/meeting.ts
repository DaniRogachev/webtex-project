export interface Participator {
  username: string;
  status: 'invited' | 'accepted' | 'declined';
  responded_at?: string; // ISO 8601 format, optional
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  createdBy: string;
  createdAt: string; // ISO 8601 format
  participators: Participator[];
}

export interface Vote {
  id: string;
  meetingId: string;
  username: string;
  date: string; // ISO 8601 format (YYYY-MM-DD)
  hour: number;
  minute: number;
  createdAt: string; // ISO 8601 format
}
