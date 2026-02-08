/**
 * OAuth 2.0 Types
 * Tipovi za OAuth autentifikaciju putem Google i GitHub provajdera
 */

export interface OAuthUserProfile {
  provider: "google" | "github";
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
  scope: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubUserInfo {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url?: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}
