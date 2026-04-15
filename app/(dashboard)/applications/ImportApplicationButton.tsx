"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImportApplicationButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleImport() {
    if (!applicationId.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/entrata/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: applicationId.trim() }),
        });
        const data = await res.json() as { applicantId?: string; error?: string };
        if (!res.ok || data.error) {
          setError(data.error ?? "Import failed");
          return;
        }
        // Navigate to the newly imported applicant
        router.push(`/applications/${data.applicantId}`);
      } catch {
        setError("Could not reach the server. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        <Download className="w-4 h-4" />
        Import Application
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Import Application</h2>
              <button
                onClick={() => { setOpen(false); setError(null); setApplicationId(""); }}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Enter the Entrata Application ID. The applicant info, rental history,
              and landlord contacts will be pulled automatically.
            </p>

            <input
              autoFocus
              type="text"
              placeholder="Entrata Application ID"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            {error && (
              <p className="mb-3 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setOpen(false); setError(null); setApplicationId(""); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={pending || !applicationId.trim()}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors",
                  pending || !applicationId.trim()
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                <Download className="w-4 h-4" />
                {pending ? "Importing…" : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
