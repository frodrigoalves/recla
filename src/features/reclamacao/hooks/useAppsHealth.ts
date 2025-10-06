import { useEffect, useRef, useState } from "react";
import { appsScriptUrl } from "@/config/appsScript";

const APPS_URL = appsScriptUrl;
const RETRY_DELAY_MS = 2000;

interface HealthState {
  loading: boolean;
  ok: boolean;
}

export function useAppsHealth(): HealthState {
  const [loading, setLoading] = useState(Boolean(APPS_URL));
  const [ok, setOk] = useState(false);
  const retriedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let retryTimeout: number | undefined;

    if (!APPS_URL) {
      setLoading(false);
      setOk(false);
      return () => undefined;
    }

    const runCheck = async () => {
      try {
        const response = await fetch(`${APPS_URL}?health=1`);
        if (cancelled) return;

        if (response.ok) {
          setOk(true);
        } else if (!retriedRef.current) {
          retriedRef.current = true;
          retryTimeout = window.setTimeout(runCheck, RETRY_DELAY_MS);
          return;
        } else {
          setOk(false);
        }
      } catch (error) {
        if (cancelled) return;
        if (!retriedRef.current) {
          retriedRef.current = true;
          retryTimeout = window.setTimeout(runCheck, RETRY_DELAY_MS);
          return;
        }
        setOk(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    runCheck();

    return () => {
      cancelled = true;
      if (retryTimeout) {
        window.clearTimeout(retryTimeout);
      }
    };
  }, []);

  return { loading, ok: ok && Boolean(APPS_URL) };
}
