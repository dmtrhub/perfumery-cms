import axios from "axios";
import { Logger } from "../Infrastructure/Logger";
import {
  OAuthUserProfile,
  GoogleTokenResponse,
  GoogleUserInfo,
  GitHubTokenResponse,
  GitHubUserInfo,
  GitHubEmail,
} from "../Domain/types/OAuthTypes";
import { AuthenticationException } from "../Domain/exceptions/AuthenticationException";

/**
 * OAuthService
 * Servis za OAuth 2.0 autentifikaciju putem Google i GitHub provajdera
 */
export class OAuthService {
  private readonly logger: Logger;

  // Google OAuth konfiguracija
  private readonly GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  private readonly GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
  private readonly GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:5001/api/v1/auth/google/callback";

  // GitHub OAuth konfiguracija
  private readonly GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
  private readonly GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
  private readonly GITHUB_REDIRECT_URI =
    process.env.GITHUB_REDIRECT_URI ||
    "http://localhost:5001/api/v1/auth/github/callback";

  constructor() {
    this.logger = Logger.getInstance();
  }

  // ==================== GOOGLE ====================

  /**
   * Generiše Google OAuth 2.0 URL za autorizaciju
   */
  getGoogleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.GOOGLE_CLIENT_ID,
      redirect_uri: this.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Obrađuje Google OAuth callback - razmenjuje code za token i dohvata korisnički profil
   */
  async handleGoogleCallback(code: string): Promise<OAuthUserProfile> {
    try {
      this.logger.info("OAuthService", "🔐 Processing Google OAuth callback...");

      // 1. Razmeni authorization code za access token
      const tokenResponse = await axios.post<GoogleTokenResponse>(
        "https://oauth2.googleapis.com/token",
        {
          code,
          client_id: this.GOOGLE_CLIENT_ID,
          client_secret: this.GOOGLE_CLIENT_SECRET,
          redirect_uri: this.GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const { access_token } = tokenResponse.data;

      // 2. Dohvati korisničke informacije
      const userResponse = await axios.get<GoogleUserInfo>(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      const googleUser = userResponse.data;

      this.logger.info(
        "OAuthService",
        `✅ Google user profile fetched: ${googleUser.email}`
      );

      return {
        provider: "google",
        id: googleUser.id,
        email: googleUser.email,
        firstName: googleUser.given_name || googleUser.name?.split(" ")[0] || "Google",
        lastName: googleUser.family_name || googleUser.name?.split(" ").slice(1).join(" ") || "User",
        picture: googleUser.picture,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("OAuthService", `❌ Google OAuth failed: ${message}`);
      throw new AuthenticationException("Google authentication failed");
    }
  }

  // ==================== GITHUB ====================

  /**
   * Generiše GitHub OAuth URL za autorizaciju
   */
  getGitHubAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.GITHUB_CLIENT_ID,
      redirect_uri: this.GITHUB_REDIRECT_URI,
      scope: "read:user user:email",
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Obrađuje GitHub OAuth callback - razmenjuje code za token i dohvata korisnički profil
   */
  async handleGitHubCallback(code: string): Promise<OAuthUserProfile> {
    try {
      this.logger.info("OAuthService", "🔐 Processing GitHub OAuth callback...");

      // 1. Razmeni authorization code za access token
      const tokenResponse = await axios.post<GitHubTokenResponse>(
        "https://github.com/login/oauth/access_token",
        {
          client_id: this.GITHUB_CLIENT_ID,
          client_secret: this.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: this.GITHUB_REDIRECT_URI,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const { access_token } = tokenResponse.data;

      if (!access_token) {
        throw new AuthenticationException("Failed to obtain GitHub access token");
      }

      // 2. Dohvati korisničke informacije
      const userResponse = await axios.get<GitHubUserInfo>(
        "https://api.github.com/user",
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      const githubUser = userResponse.data;

      // 3. Dohvati email (može biti privatan)
      let email = githubUser.email;
      if (!email) {
        const emailsResponse = await axios.get<GitHubEmail[]>(
          "https://api.github.com/user/emails",
          { headers: { Authorization: `Bearer ${access_token}` } }
        );

        const primaryEmail = emailsResponse.data.find(
          (e) => e.primary && e.verified
        );
        email = primaryEmail?.email || emailsResponse.data[0]?.email || null;
      }

      if (!email) {
        throw new AuthenticationException(
          "Could not retrieve email from GitHub. Please ensure your email is public or verified."
        );
      }

      // Parsiranje imena
      const nameParts = (githubUser.name || githubUser.login || "GitHub User").split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "User";

      this.logger.info(
        "OAuthService",
        `✅ GitHub user profile fetched: ${email}`
      );

      return {
        provider: "github",
        id: String(githubUser.id),
        email,
        firstName,
        lastName,
        picture: githubUser.avatar_url,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("OAuthService", `❌ GitHub OAuth failed: ${message}`);
      if (error instanceof AuthenticationException) throw error;
      throw new AuthenticationException("GitHub authentication failed");
    }
  }
}
