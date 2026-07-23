declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/**
 * Flag to control reCAPTCHA verification across all forms and API endpoints.
 * Explicitly set to `false` to disable reCAPTCHA regardless of environment variables.
 * Change to `true` when reCAPTCHA is ready to be re-enabled.
 */
export const IS_RECAPTCHA_ENABLED = false;

export async function verifyRecaptchaToken(token: string): Promise<{ success: boolean; score?: number; error?: string }> {
  if (!IS_RECAPTCHA_ENABLED) {
    return { success: true, score: 1.0 };
  }

  const secretKey = process.env.SEC_KEY_SI_CAPTCHA;
  if (!secretKey) {
    console.warn("SEC_KEY_SI_CAPTCHA is missing from environment variables");
    return { success: false, error: "Server misconfiguration: missing secret key" };
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });

    const data = await response.json();
    if (!data.success) {
      return { success: false, error: data["error-codes"]?.join(", ") || "reCAPTCHA verification failed" };
    }

    const score = typeof data.score === "number" ? data.score : 1.0;
    if (score < 0.5) {
      return { success: false, score, error: `Low reCAPTCHA score (${score})` };
    }

    return { success: true, score };
  } catch (err: any) {
    console.error("reCAPTCHA verification error:", err);
    return { success: false, error: err?.message || "reCAPTCHA verification error" };
  }
}

let cachedSiteKey: string | null = null;
let scriptLoadingPromise: Promise<void> | null = null;

async function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.grecaptcha) return;

  if (!scriptLoadingPromise) {
    scriptLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  return scriptLoadingPromise;
}

export async function getRecaptchaToken(action: string = "submit"): Promise<string | null> {
  if (!IS_RECAPTCHA_ENABLED) return null;
  if (typeof window === "undefined") return null;

  try {
    if (!cachedSiteKey) {
      const res = await fetch("/api/config/recaptcha");
      if (!res.ok) throw new Error("Failed to fetch reCAPTCHA config");
      const data = await res.json();
      cachedSiteKey = data.siteKey || null;
    }

    if (!cachedSiteKey) {
      console.warn("SITE_KEY_SI_CAPTCHA is empty");
      return null;
    }

    await loadRecaptchaScript(cachedSiteKey);

    return new Promise((resolve) => {
      if (!window.grecaptcha) {
        console.warn("grecaptcha not available on window");
        resolve(null);
        return;
      }

      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(cachedSiteKey!, { action });
          resolve(token);
        } catch (err) {
          console.error("Failed to execute grecaptcha:", err);
          resolve(null);
        }
      });
    });
  } catch (err) {
    console.error("Error in getRecaptchaToken:", err);
    return null;
  }
}
