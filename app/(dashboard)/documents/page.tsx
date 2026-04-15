import { db } from "@/lib/db";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";
import { FileText, FileImage, File, CheckCircle2, Clock, AlertCircle, Search } from "lucide-react";

const extractionBadge: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  complete: { label: "Extracted", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

const docTypeLabel: Record<string, string> = {
  id: "Government ID",
  pay_stub: "Pay Stub",
  bank_statement: "Bank Statement",
  lease: "Lease Agreement",
  tax_return: "Tax Return",
  other: "Other",
};

function DocIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType?.startsWith("image/")) return <FileImage className="w-5 h-5 text-violet-400" />;
  if (mimeType === "application/pdf") return <FileText className="w-5 h-5 text-blue-400" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

function ExtractionIcon({ status }: { status: string }) {
  if (status === "complete") return <CheckCircle2 className="w-3 h-3" />;
  if (status === "failed") return <AlertCircle className="w-3 h-3" />;
  return <Clock className="w-3 h-3" />;
}

export default async function DocumentsPage() {
  const docs = await db.uploadedDocument.findMany({
    include: {
      applicant: { select: { id: true, firstName: true, lastName: true } },
      rentalHistoryEntry: { select: { addressLine1: true, city: true, state: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingCount = docs.filter((d) => d.extractionStatus === "pending").length;
  const extractedCount = docs.filter((d) => d.extractionStatus === "complete").length;
  const failedCount = docs.filter((d) => d.extractionStatus === "failed").length;

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="mt-1 text-sm text-slate-500">
          All uploaded documents, OCR extraction status, and evidence review.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Total</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{docs.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Extracted</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{extractedCount}</p>
        </div>
        <div className={`rounded-xl border border-slate-200 px-5 py-4 ${failedCount > 0 ? "bg-rose-50" : "bg-amber-50"}`}>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            {failedCount > 0 ? "Failed" : "Pending"}
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{failedCount > 0 ? failedCount : pendingCount}</p>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center">
          <Search className="mx-auto w-10 h-10 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No documents yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Documents uploaded from applicant profiles will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
          {docs.map((doc) => {
            const badge = extractionBadge[doc.extractionStatus] ?? extractionBadge.pending;
            const typeLabel = docTypeLabel[doc.type] ?? doc.type;

            return (
              <div key={doc.id} className="flex items-start gap-4 px-5 py-4">
                <div className="mt-0.5 flex-shrink-0">
                  <DocIcon mimeType={doc.mimeType} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{typeLabel}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                      <ExtractionIcon status={doc.extractionStatus} />
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <Link
                      href={`/applications/${doc.applicant.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {doc.applicant.firstName} {doc.applicant.lastName}
                    </Link>
                    {doc.rentalHistoryEntry && (
                      <>
                        <span>·</span>
                        <span>{doc.rentalHistoryEntry.addressLine1}, {doc.rentalHistoryEntry.city}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{relativeTime(doc.createdAt)}</span>
                  </div>

                  {doc.extractedText && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 rounded-lg bg-slate-50 px-3 py-2 font-mono">
                      {doc.extractedText}
                    </p>
                  )}
                </div>

                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  View
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
