import { db } from "@/lib/db";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Building2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

// Group rental history entries by landlord identity (email → phone → name fallback)
function landlordKey(entry: {
  landlordEmail: string | null;
  landlordPhone: string | null;
  landlordName: string | null;
}): string {
  return entry.landlordEmail ?? entry.landlordPhone ?? entry.landlordName ?? "__unknown__";
}

export default async function LandlordsPage() {
  const entries = await db.rentalHistoryEntry.findMany({
    where: {
      OR: [
        { landlordName: { not: null } },
        { landlordEmail: { not: null } },
        { landlordPhone: { not: null } },
      ],
    },
    include: {
      applicant: true,
      landlordVerificationRequests: {
        include: { response: true },
        orderBy: { createdAt: "desc" },
      },
      landlordContactVerifications: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by landlord key
  const grouped = new Map<
    string,
    typeof entries
  >();
  for (const entry of entries) {
    const key = landlordKey(entry);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(entry);
  }

  const landlords = Array.from(grouped.entries()).map(([key, group]) => {
    const sample = group[0];
    const allRequests = group.flatMap((e) => e.landlordVerificationRequests);
    const pendingCount = allRequests.filter((r) => r.status === "pending").length;
    const completedCount = allRequests.filter((r) => r.status === "completed").length;
    const wouldRentAgainValues = allRequests
      .flatMap((r) => r.response ?? [])
      .map((r) => r.wouldRentAgain)
      .filter((v) => v !== null);
    const wouldRentAgainNo = wouldRentAgainValues.filter((v) => v === false).length;

    return {
      key,
      name: sample.landlordName ?? "Unknown",
      email: sample.landlordEmail,
      phone: sample.landlordPhone,
      managementCompany: sample.managementCompany,
      contactVerification: sample.landlordContactVerifications[0] ?? null,
      entries: group,
      pendingCount,
      completedCount,
      wouldRentAgainNo,
    };
  });

  // Sort: flagged first, then most tenants
  landlords.sort((a, b) => {
    if (a.wouldRentAgainNo !== b.wouldRentAgainNo) return b.wouldRentAgainNo - a.wouldRentAgainNo;
    return b.entries.length - a.entries.length;
  });

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Landlords</h1>
        <p className="mt-1 text-sm text-slate-500">
          All unique landlord contacts across applications, with response history.
        </p>
      </div>

      {landlords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-16 text-center">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            No landlord contacts yet. Add landlord info to a rental history entry to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {landlords.map((ll) => {
            const isSuspicious =
              ll.contactVerification?.suspicious === true || ll.wouldRentAgainNo > 0;

            return (
              <div
                key={ll.key}
                className={cn(
                  "rounded-2xl border bg-white p-5",
                  isSuspicious ? "border-rose-200" : "border-slate-200"
                )}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                      isSuspicious ? "bg-rose-100" : "bg-slate-100"
                    )}>
                      <Building2 className={cn("w-4 h-4", isSuspicious ? "text-rose-500" : "text-slate-500")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">{ll.name}</p>
                        {ll.managementCompany && (
                          <span className="text-xs text-slate-400">· {ll.managementCompany}</span>
                        )}
                        {isSuspicious && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                            <AlertTriangle className="w-3 h-3" />
                            Flagged
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {[ll.email, ll.phone].filter(Boolean).join(" · ") || "No contact info"}
                      </p>
                      {ll.contactVerification && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Contact verified via {ll.contactVerification.source}
                          {ll.contactVerification.confidenceScore != null &&
                            ` · ${ll.contactVerification.confidenceScore}% confidence`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    {ll.completedCount > 0 && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{ll.completedCount} responded</span>
                      </div>
                    )}
                    {ll.pendingCount > 0 && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ll.pendingCount} pending</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tenant list */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {ll.entries.length === 1 ? "1 tenant" : `${ll.entries.length} tenants`}
                  </p>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                    {ll.entries.map((entry) => {
                      const latestRequest = entry.landlordVerificationRequests[0];
                      const response = latestRequest?.response;
                      return (
                        <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                          <div>
                            <Link
                              href={`/applications/${entry.applicant.id}`}
                              className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                            >
                              {entry.applicant.firstName} {entry.applicant.lastName}
                            </Link>
                            <p className="text-xs text-slate-400">
                              {entry.addressLine1}, {entry.city}, {entry.state}
                              {entry.moveInDate && ` · ${new Date(entry.moveInDate).getFullYear()}`}
                              {entry.moveOutDate && `–${new Date(entry.moveOutDate).getFullYear()}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {response?.wouldRentAgain === true && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Would rent again</span>
                            )}
                            {response?.wouldRentAgain === false && (
                              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">Would not rent again</span>
                            )}
                            {!latestRequest && (
                              <span className="text-xs text-slate-300">No request sent</span>
                            )}
                            {latestRequest && !response && (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Awaiting response</span>
                            )}
                            {response?.paymentHistoryRating && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 capitalize">
                                {response.paymentHistoryRating} payment history
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
