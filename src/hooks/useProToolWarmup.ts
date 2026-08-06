import { useEffect, useRef } from "react";
import { functions } from "../lib/qofeno-appwrite";

/**
 * Sends a pre-warm ping to the Azure container via azure-manager function
 * as soon as a paid user navigates to a Pro tool page.
 *
 * By the time they upload their file and click Process, the container
 * will already be warm (or warming up), cutting perceived wait time
 * from 30–60s to <5s on subsequent requests.
 *
 * Silently fails — the container will still wake on the actual request.
 */
export function useProToolWarmup(isProTool: boolean, isPaidUser: boolean) {
  const warmed = useRef(false);

  useEffect(() => {
    if (!isProTool || !isPaidUser || warmed.current) return;

    const warmUp = async () => {
      try {
        // Fire-and-forget (async: true) — does not block UI rendering
        await functions.createExecution(
          "azure-manager",
          JSON.stringify({ action: "wake" }),
          true   // async — don't wait for container to fully wake
        );
        warmed.current = true;
        console.debug("⚡ Azure processor pre-warm triggered");
      } catch {
        // Silently fail — container wakes on the actual tool request
      }
    };

    // 500ms delay: let the page render first, then warm in background
    const timer = setTimeout(warmUp, 500);
    return () => clearTimeout(timer);
  }, [isProTool, isPaidUser]);
}
