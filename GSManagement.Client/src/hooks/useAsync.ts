/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../lib/api";

// Runs `fn` on mount and whenever it changes (wrap it in useCallback).
// Responses from superseded calls are ignored, so fast filter changes can't
// overwrite newer data with stale results.
export function useAsync<T>(fn: () => Promise<T>, fallbackError: string) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const callId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++callId.current;
    setLoading(true);
    try {
      const result = await fn();
      if (id === callId.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (id === callId.current) setError(getErrorMessage(err, fallbackError));
    } finally {
      if (id === callId.current) setLoading(false);
    }
  }, [fn, fallbackError]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, error, setError, reload };
}
