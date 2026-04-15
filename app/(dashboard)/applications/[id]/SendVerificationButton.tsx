"use client";

import { useTransition, useState } from "react";
import { createVerificationRequest } from "./actions";
import { Send, Copy, Check, Clock, BadgeCheck, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExistingRequest {
  token: string;
  status: string;
}

interface Props {
  entryId: string;
  applicantId: string;
  latestRequest?: ExistingRequest;
}

export default function SendVerificationButton({ entryId, applicantId, latestRequest }: Props) {
  const [pending, startTransition] = useTransition();
  const [newToken, setNewToken] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailAddress, setEmailAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeToken = newToken ?? (latestRequest?.status === "pending" ? latestRequest.token : null);
  const isCompleted = !newToken && latestRequest?.status === "completed";

  function buildLink(token: string) {
    return `${window.location.origin}/landlord/${token}`;
  }

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const result = await createVerificationRequest(entryId, applicantId, window.location.origin);
      if ("error" in result) {
        setError(result.error);
      } else {
        setNewToken(result.token);
        setEmailSent(result.emailSent);
        setEmailAddress(result.emailAddress);
      }
    });
  }

  async function handleCopy(token: string) {
    try {
      await navigator.clipboard.writeText(buildLink(token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available — user can select manually
    }
  }

  if (isCompleted) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <BadgeCheck className="w-4 h-4" />
          <span className="font-medium">Landlord responded</span>
        </div>
        <button
          onClick={handleSend}
          disabled={pending}
          className="text-xs text-emerald-600 hover:text-emerald-800 underline underline-offset-2 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Re-send"}
        </button>
      </div>
    );
  }

  if (activeToken) {
    const link = buildLink(activeToken);
    return (
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-700">Awaiting landlord response</span>
        </div>

        {emailSent && emailAddress && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700">
            <Mail className="w-3.5 h-3.5" />
            <span>Email sent to {emailAddress}</span>
          </div>
        )}
        {!emailSent && emailAddress && (
          <p className="text-xs text-rose-600">Email delivery failed — share the link below.</p>
        )}
        {!emailAddress && (
          <p className="text-xs text-slate-500">No landlord email on file — share this link manually.</p>
        )}

        <div className="flex items-center gap-2">
          <input
            readOnly
            value={link}
            className="flex-1 rounded bg-white border border-amber-200 px-2 py-1.5 text-xs text-slate-600 truncate focus:outline-none"
          />
          <button
            onClick={() => handleCopy(activeToken)}
            className={cn(
              "flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              copied
                ? "bg-emerald-100 text-emerald-700"
                : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-100"
            )}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {error && <p className="mb-2 text-xs text-rose-600">{error}</p>}
      <button
        onClick={handleSend}
        disabled={pending}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors",
          pending ? "opacity-60 cursor-not-allowed" : "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        )}
      >
        <Send className="w-3.5 h-3.5" />
        {pending ? "Creating…" : "Request landlord verification"}
      </button>
    </div>
  );
}
