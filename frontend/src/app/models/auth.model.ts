export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
}

export interface LoginRequest {
  username: string; // email
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
