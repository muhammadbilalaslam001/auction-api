export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[];
  timestamp: string;
}
