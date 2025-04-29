export interface Meeting {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  createdBy: string;
  createdAt: string; // ISO 8601 format
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
