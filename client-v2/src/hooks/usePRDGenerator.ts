import { useState, useCallback, useEffect, useRef } from "react";
import type { PRDSession } from "../types";
import * as scrumApi from "../api/scrum";

export function usePRDGenerator(sessionId: string | null) {
  const [session, setSession] = useState<PRDSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSession = useCallback(async (sid: string) => {
    setIsLoading(true);
    try {
      const s = await scrumApi.getPRDSession(sid);
      setSession(s);
      setIsPolling(s.status === "processing");
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      setSession(null);
      setIsPolling(false);
    }
  }, [sessionId, loadSession]);

  // Poll when processing
  useEffect(() => {
    if (isPolling && sessionId) {
      pollRef.current = setInterval(async () => {
        try {
          const s = await scrumApi.getPRDSession(sessionId);
          setSession(s);
          if (s.status !== "processing") {
            setIsPolling(false);
          }
        } catch {
          // ignore poll errors
        }
      }, 3000);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isPolling, sessionId]);

  const generate = useCallback(
    async (file: File, options: Record<string, boolean>, prompt?: string, businessDocIds?: string[]) => {
      if (!sessionId) return;

      const formData = new FormData();
      formData.append("prdFile", file);
      formData.append("sessionId", sessionId);
      formData.append("projectKey", "");
      formData.append("prompt", prompt ?? "");
      formData.append("options", JSON.stringify(options));
      if (businessDocIds?.length) {
        formData.append("businessDocIds", JSON.stringify(businessDocIds));
      }

      await scrumApi.generateSuggestions(formData);
      setIsPolling(true);
    },
    [sessionId]
  );

  return { session, isLoading, isPolling, generate, loadSession };
}
