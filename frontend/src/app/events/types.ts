export type UserRole = "MAIN_ADMIN" | "COLLEGE_ADMIN";

export type EventImageCategory = "banner" | "audience" | "other";

export interface OrganizationOption {
  _id: string;
  name: string;
  address?: string;
}

export interface EventImage {
  _id: string;
  category: EventImageCategory;
  label?: string;
  url: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  driveWebContentLink?: string;
  originalName: string;
  size?: number;
}

export interface EventRecord {
  _id: string;
  organizationId: OrganizationOption;
  programName: string;
  participantsCount: number;
  winners: string[];
  programDate: string;
  programNature: string;
  guestDetails?: string;
  description?: string;
  images: EventImage[];
  createdAt: string;
  updatedAt: string;
}
