import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import AddRentalHistoryForm from "./AddRentalHistoryForm";
import DeleteEntryButton from "./DeleteEntryButton";
import SendVerificationButton from "./SendVerificationButton";

const severityColors: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-rose-100 text-rose-700",
};

export default async function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const applicant = await db.applicant.findUnique({
    where: { id },
    include: {
      rentalHistory: {
        include: {
          landlordVerificationRequests: { include: { response: true }, orderBy: { createdAt: "desc" } },
          landlordContactVerifications: true,
          addressVerifications: true,
        },
      },
      findings: { orderBy: { createdAt: "desc" } },
      decisions: { orderBy: { createdAt: "desc" }, take: 1 },
      documents: true,
      auditLogs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!applicant) notFound();

  const decision = applicant.decisions[0];

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{applicant.firstName} {applicant.lastName}</h1>
            <p className="mt-1 text-sm text-slate-500">{applicant.email ?? "No email"} · {applicant.phone}</p>
          </div>
          {decision && (
            <div className="rounded-xl bg-slate-900 px-4 py-3 text-white">
              <p className="text-xs uppercase tracking-wide text-slate-400">Current decision</p>
              <p className="mt-1 text-lg font-semibold capitalize">{decision.overallStatus.replaceAll("_", " ")}</p>
              <p className="text-sm text-slate-300">Confidence {decision.confidenceScore}%</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Rental history</h2>
            <div className="mt-4 space-y-4">
              {applicant.rentalHistory.length === 0 && (
                <p className="text-sm text-slate-400">No rental history entries yet.</p>
              )}
              {applicant.rentalHistory.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{entry.addressLine1}</p>
                      {entry.addressLine2 && <p className="text-xs text-slate-500">{entry.addressLine2}</p>}
                      <p className="text-sm text-slate-500">{entry.city}, {entry.state} {entry.zip}</p>
                      {entry.currentResidence && (
                        <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Current</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.monthlyRent && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">${entry.monthlyRent}/mo</span>}
                      <DeleteEntryButton entryId={entry.id} applicantId={applicant.id} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Claimed landlord</p>
                      <p>{entry.landlordName ?? "Unknown"}</p>
                      <p>{entry.landlordEmail ?? entry.landlordPhone ?? "No contact provided"}</p>
                      {entry.managementCompany && <p className="text-xs text-slate-400">{entry.managementCompany}</p>}
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Verification activity</p>
                      <p>{entry.landlordVerificationRequests.length} landlord request(s)</p>
                      <p>{entry.addressVerifications.length} address match check(s)</p>
                    </div>
                  </div>
                  {entry.reasonForLeaving && (
                    <p className="mt-2 text-xs text-slate-500">
                      <span className="font-medium">Reason for leaving:</span> {entry.reasonForLeaving}
                    </p>
                  )}
                  <SendVerificationButton
                    entryId={entry.id}
                    applicantId={applicant.id}
                    latestRequest={entry.landlordVerificationRequests[0]}
                  />
                </div>
              ))}
            </div>
            <AddRentalHistoryForm applicantId={applicant.id} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Findings</h2>
            <div className="mt-4 space-y-3">
              {applicant.findings.map((finding) => (
                <div key={finding.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{finding.message}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{finding.category} · {finding.source}</p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", severityColors[finding.severity] ?? "bg-slate-100 text-slate-700")}>
                      {finding.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Decision summary</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{decision?.summary ?? "No decision summary yet."}</p>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <p>Manual review required: <span className="font-semibold text-slate-900">{decision?.manualReviewRequired ? "Yes" : "No"}</span></p>
              <p className="mt-1">Decided by: <span className="font-semibold text-slate-900">{decision?.decidedBy ?? "Pending"}</span></p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {applicant.documents.length === 0 ? (
                <p>No documents uploaded yet.</p>
              ) : (
                applicant.documents.map((doc) => (
                  <div key={doc.id} className="rounded-lg border border-slate-200 px-3 py-2">
                    <p className="font-medium text-slate-800">{doc.type}</p>
                    <p className="text-xs text-slate-400">{doc.extractionStatus}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Audit trail</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {applicant.auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="font-medium text-slate-800">{log.action}</p>
                  <p className="text-xs text-slate-400">{log.actorType}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
