import React, { useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuthHook";
import { useNavigate } from "react-router-dom";

/**
 * OAuthButtons
 * Dugmad za OAuth 2.0 prijavu putem Google i GitHub provajdera
 * Koristi Electron IPC za otvaranje OAuth prozora
 */
export const OAuthButtons: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleOAuthToken = useCallback(
    (token: string) => {
      login(token);
      navigate("/dashboard");
    },
    [login, navigate]
  );

  const handleOAuthError = useCallback((error: string) => {
    console.error("OAuth error:", error);
  }, []);

  useEffect(() => {
    // Slušaj OAuth token/error iz Electron main procesa
    const api = window.electronAPI;
    if (!api) return;

    api.on<string>("oauth:token", handleOAuthToken);
    api.on<string>("oauth:error", handleOAuthError);

    return () => {
      api.off<string>("oauth:token", handleOAuthToken);
      api.off<string>("oauth:error", handleOAuthError);
    };
  }, [handleOAuthToken, handleOAuthError]);

  const handleGoogleLogin = () => {
    if (window.electronAPI) {
      window.electronAPI.openOAuth("google");
    } else {
      // Fallback za browser development
      window.open(
        `${import.meta.env.VITE_GATEWAY_URL}/auth/google`,
        "_blank",
        "width=600,height=700"
      );
    }
  };

  const handleGitHubLogin = () => {
    if (window.electronAPI) {
      window.electronAPI.openOAuth("github");
    } else {
      window.open(
        `${import.meta.env.VITE_GATEWAY_URL}/auth/github`,
        "_blank",
        "width=600,height=700"
      );
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Divider */}
      <div
        className="flex items-center gap-3"
        style={{ margin: "4px 0" }}
      >
        <div
          style={{
            flex: 1,
            height: "1px",
            backgroundColor: "var(--win11-divider)",
          }}
        />
        <span
          style={{
            fontSize: "12px",
            color: "var(--win11-text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          ili nastavi pomoću
        </span>
        <div
          style={{
            flex: 1,
            height: "1px",
            backgroundColor: "var(--win11-divider)",
          }}
        />
      </div>

      {/* Google Button */}
      <button
        type="button"
        className="btn"
        onClick={handleGoogleLogin}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "10px 16px",
          backgroundColor: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "6px",
          color: "var(--win11-text-primary)",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
        }}
      >
        {/* Google SVG Icon */}
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.99 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Prijavi se pomoću Google naloga
      </button>

      {/* GitHub Button */}
      <button
        type="button"
        className="btn"
        onClick={handleGitHubLogin}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "10px 16px",
          backgroundColor: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "6px",
          color: "var(--win11-text-primary)",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
        }}
      >
        {/* GitHub SVG Icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        Prijavi se pomoću GitHub naloga
      </button>
    </div>
  );
};
