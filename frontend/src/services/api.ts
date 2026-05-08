import axios, { AxiosError } from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  CertificateInput,
  CertificateListResponse,
  CertificateSummary,
  DeleteCertificateResponse,
  GenerateCertificateResponse,
  SignInInput,
  SignUpInput,
  SearchField,
  UserProfileResponse,
} from '../types/certificate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AUTH_TOKEN_KEY = 'certificate_auth_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const unwrap = <T>(response: { data: ApiResponse<T> }): T => {
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Request failed');
  }

  return response.data.data;
};

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    const payload = axiosError.response?.data;
    const fieldErrors = payload?.error?.details
      ?.map((detail) => `${detail.field}: ${detail.message}`)
      .join(', ');

    return fieldErrors || payload?.error?.message || axiosError.message;
  }

  return error instanceof Error ? error.message : 'Something went wrong';
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getAuthToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY);

export const signUp = async (input: SignUpInput): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', input);

  return unwrap(response);
};

export const signIn = async (input: SignInInput): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signin', input);

  return unwrap(response);
};

export const getCurrentUser = async (): Promise<UserProfileResponse> => {
  const response = await apiClient.get<ApiResponse<UserProfileResponse>>('/auth/me');

  return unwrap(response);
};

export const generateCertificate = async (
  input: CertificateInput
): Promise<GenerateCertificateResponse> => {
  const response = await apiClient.post<ApiResponse<GenerateCertificateResponse>>(
    '/certificates',
    input
  );

  return unwrap(response);
};

export const getCertificates = async (params: {
  searchTerm?: string;
  searchField?: SearchField;
  page?: number;
  limit?: number;
}): Promise<CertificateListResponse> => {
  const response = await apiClient.get<ApiResponse<CertificateListResponse>>('/certificates', {
    params,
  });

  return unwrap(response);
};

export const getCertificateById = async (id: string): Promise<CertificateSummary> => {
  const response = await apiClient.get<ApiResponse<CertificateSummary>>(`/certificates/${id}`);

  return unwrap(response);
};

export const deleteCertificate = async (id: string): Promise<DeleteCertificateResponse> => {
  const response = await apiClient.delete<ApiResponse<DeleteCertificateResponse>>(
    `/certificates/${id}`
  );

  return unwrap(response);
};

export const getDownloadUrl = (id: string, format: 'pdf' | 'image'): string =>
  `${API_BASE_URL}/certificates/${id}/download?format=${format}`;

export const downloadCertificate = async (id: string, format: 'pdf' | 'image'): Promise<void> => {
  const response = await apiClient.get<Blob>(`/certificates/${id}/download`, {
    params: { format },
    responseType: 'blob',
  });
  const extension = format === 'pdf' ? 'pdf' : 'png';
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `certificate-${id}.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
