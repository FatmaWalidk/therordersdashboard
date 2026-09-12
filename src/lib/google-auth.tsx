import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from "./config";

type TokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => void;
            error_callback?: (err: unknown) => void;
          }) => TokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

type Profile = { email?: string; name?: string; picture?: string };

type AuthValue = {
  ready: boolean;
  token: string | null;
  profile: Profile | null;
  signingIn: boolean;
  error: string | null;
  configured: boolean;
  signIn: () => void;
  signOut: () => void;
  requireToken: () => string;
};

const AuthContext = createContext<AuthValue | null>(null);

const GIS_SRC = "https://accounts.google.com/gsi/client";

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("gis_load_failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gis_load_failed"));
    document.head.appendChild(script);
  });
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<TokenClient | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configured = Boolean(GOOGLE_CLIENT_ID);

  const handleToken = useCallback(async (accessToken: string, expiresIn: number) => {
    setToken(accessToken);
    setError(null);
    setSigningIn(false);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    // silent refresh shortly before expiry
    refreshTimer.current = setTimeout(
      () => clientRef.current?.requestAccessToken({ prompt: "" }),
      Math.max((expiresIn - 120) * 1000, 30_000),
    );
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setProfile(await res.json());
    } catch {
      /* profile is optional */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!configured) {
      setReady(true);
      return;
    }
    loadGis()
      .then(() => {
        if (cancelled) return;
        clientRef.current = window.google!.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_SCOPES,
          callback: (resp) => {
            if (resp.access_token) {
              void handleToken(resp.access_token, resp.expires_in ?? 3600);
            } else {
              setSigningIn(false);
              if (resp.error && resp.error !== "interaction_required") setError(resp.error);
            }
          },
          error_callback: () => setSigningIn(false),
        });
        setReady(true);
        // try a silent sign-in if the Google session is still alive
        if (sessionStorage.getItem("juhd_signed_in") === "1") {
          clientRef.current.requestAccessToken({ prompt: "" });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
          setError("تعذّر تحميل خدمة تسجيل الدخول من Google");
        }
      });
    return () => {
      cancelled = true;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [configured, handleToken]);

  const signIn = useCallback(() => {
    setError(null);
    setSigningIn(true);
    sessionStorage.setItem("juhd_signed_in", "1");
    clientRef.current?.requestAccessToken({ prompt: "consent" });
  }, []);

  const signOut = useCallback(() => {
    if (token) window.google?.accounts.oauth2.revoke(token);
    sessionStorage.removeItem("juhd_signed_in");
    setToken(null);
    setProfile(null);
  }, [token]);

  const requireToken = useCallback(() => {
    if (!token) throw new Error("no_token");
    return token;
  }, [token]);

  const value = useMemo<AuthValue>(
    () => ({ ready, token, profile, signingIn, error, configured, signIn, signOut, requireToken }),
    [ready, token, profile, signingIn, error, configured, signIn, signOut, requireToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useGoogleAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useGoogleAuth must be used inside GoogleAuthProvider");
  return ctx;
}
