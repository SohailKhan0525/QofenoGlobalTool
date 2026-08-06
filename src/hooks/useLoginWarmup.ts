import { useEffect } from "react";
import { functions } from "../lib/qofeno-appwrite";

/**
 * Pre-warms the Azure processor container when a paid user logs in.
 * Called once per session — so by the time they navigate to their first
 * Pro tool, the container cold-start is already behind them.
 */
export function useLoginWarmup(userPlan?: string) {
  useEffect(() => {
    if (!userPlan || !["pro", "teams"].includes(userPlan)) return;

    // Fire-and-forget wake ping (async: true — no UI blocking)
    functions
      .createExecution(
        "azure-manager",
        JSON.stringify({ action: "wake" }),
        true
      )
      .catch(() => {}); // Silently fail
  }, [userPlan]);
}
