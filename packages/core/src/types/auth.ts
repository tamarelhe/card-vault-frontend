export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url: string;
  created_at: string;
}
