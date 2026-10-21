// Returned by POST /api/Auth/Login and /api/Auth/RefreshToken.
export interface SessionResponse {
  accessTokenExpiresInMinutes: number;
  csrf_token: string | null;
}

// Returned by GET /api/Auth/me.
export interface CurrentUser {
  id: number;
  userName: string;
  email: string;
  imageUrl: string | null;
  roles: string[];
  permissions: string[];
}
