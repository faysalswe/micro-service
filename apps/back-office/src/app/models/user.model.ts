export interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface RegisterRequest {
  username: string;
  password?: string;
  role: string;
}
