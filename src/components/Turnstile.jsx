import { useEffect, useRef } from "react";

const SCRIPT_ID = "cf-turnstile-api";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile requires a browser"));
  }
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.turnstile), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error("Turnstile script failed"));
    document.head.appendChild(script);
  });
}

/**
 * Managed Cloudflare Turnstile widget.
 * Calls onToken(token) on success and onToken(null) when expired/errored/reset.
 * Increment resetSignal after a failed submit to refresh the token.
 */
export function Turnstile({ onToken, resetSignal = 0, language }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenRef = useRef(onToken);
  const siteKey = import.meta.env.REACT_APP_TURNSTILE_SITE_KEY;

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let cancelled = false;

    if (!siteKey || !containerRef.current) {
      onTokenRef.current?.(null);
      return undefined;
    }

    loadTurnstileApi()
      .then((turnstile) => {
        if (cancelled || !containerRef.current || !turnstile) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "light",
          language: language || "auto",
          callback: (token) => onTokenRef.current?.(token),
          "expired-callback": () => onTokenRef.current?.(null),
          "error-callback": () => onTokenRef.current?.(null),
          "timeout-callback": () => onTokenRef.current?.(null),
        });
      })
      .catch(() => {
        if (!cancelled) onTokenRef.current?.(null);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, language]);

  useEffect(() => {
    if (!resetSignal) return;
    if (widgetIdRef.current != null && window.turnstile) {
      onTokenRef.current?.(null);
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal]);

  if (!siteKey) {
    return (
      <p className="text-sm text-amber-700" role="status">
        Turnstile site key is not configured (REACT_APP_TURNSTILE_SITE_KEY).
      </p>
    );
  }

  return <div ref={containerRef} className="overflow-hidden" />;
}
