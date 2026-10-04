export interface AuthUserProfile {
  id: string;
  name: string;
  email: string;
  given_name?: string;
  family_name?: string;
  role?: string;
  roles?: string[];
  avatar?: string;
  organisation?: string;
  image?: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profile: AuthUserProfile;
  access_token: string;
  token_type?: string;
  expires_at?: number;
}
