export type CertificateFormat = 'pdf' | 'image' | 'both';
export type SearchField = 'name' | 'id';

export interface UserProfile {
  id: string;
  name: string;
  companyName: string;
  email: string;
  createdAt: string;
}

export interface SignUpInput {
  name: string;
  companyName: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface UserProfileResponse {
  user: UserProfile;
}

export interface CertificateInput {
  participantName: string;
  role: string;
  eventOrInternship: string;
  date: string;
  format: CertificateFormat;
}

export interface CertificateSummary {
  _id?: string;
  id?: string;
  participantName: string;
  role: string;
  eventOrInternship: string;
  date: string;
  uniqueCertificateId: string;
  generatedAt: string;
  issuedAt?: string;
  issuedBy?: string;
  format: CertificateFormat;
  filePaths?: {
    pdf?: string;
    image?: string;
  };
}

export interface GenerateCertificateResponse {
  certificateId: string;
  uniqueCertificateId: string;
  issuedAt: string;
  issuedBy: string;
  downloadUrls: {
    pdf?: string;
    image?: string;
  };
}

export interface DeleteCertificateResponse {
  certificateId: string;
  uniqueCertificateId: string;
}

export interface CertificateListResponse {
  certificates: CertificateSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
}
