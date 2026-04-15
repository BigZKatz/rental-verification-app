"use client";

import { useEffect, useState, useTransition } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncRun {
  id: string;
  status: string;
  applicantsFound: number;
  applicantsUpserted: number;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SyncStatusBanner() {
  const [latest, setLatest] = useState<SyncRun | null>(null);
  const [pending, startTransition] = useTransition();

  async function fetchStatus() {
    try {
      const res = await fetch("/api/entrata/sync");
      const data = await res.json() as { latest: SyncRun | null };
      setLatest(data.latest);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    void fetchStatus();
    const id = setInterval(() => { void fetchStatus(); }, 30_000);
    return () => clearInterval(id);
  }, []);

  function handleSyncNow() {
    startTransition(async () => {
      try {
        await fetch("/api/entrata/sync", { method: "POST" });
        await fetchStatus();
        window.location.reload();
      } catch {
        await fetchStatus();
      }
    });
  }

  const isRunning = latest?.status === "running" || pending;

  return (
    <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2.5 text-sm">
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-slate-600">Syncing from Entrata&hellip;</span>
          </>
        ) : latest?.status === "failed" ? (
          <>
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span className="text-slate-600">
              Last sync failed{latest.completedAt ? ` · ${relativeTime(latest.completedAt)}` : ""}
            </span>
            <span className="text-xs text-rose-500 truncate max-w-xs">{latest.error}</span>
          </>
        ) : latest?.status === "completed" ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-600">
              Last synced {latest.completedAt ? relativeTime(latest.completedAt) : ""}
              {latest.applicantsUpserted > 0
                ? ` · ${latest.applicantsUpserted} application${latest.applicantsUpserted === 1 ? "" : "s"} updated`
                : " · No changes"}
            </span>
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500">Not yet synced from Entrata</span>
          </>
        )}
      </div>

      <button
        onClick={handleSyncNow}
        disabled={isRunning}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
          isRunning
            ? "cursor-not-allowed bg-slate-200 text-slate-400"
            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
        )}
      >
        <RefreshCw className={cn("w-3.5 h-3.5", isRunning && "animate-spin")} />
        {isRunning ? "Syncing\u2026" : "Sync now"}
      </button>
    </div>
  );
}
