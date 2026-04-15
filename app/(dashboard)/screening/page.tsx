import { db } from "@/lib/db";
import Link from "next/link";
import { cn, relativeTime } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Landmark,
  FileSearch,
  CheckCircle2,
} from "lucide-react";

const decisionColors: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  flagged: "bg-amber-100 text-amber-700",
  declined: "bg-rose-100 text-rose-700",
};

const DecisionIcon = ({ status }: { status: string }) => {
  if (status === "approved") return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
  if (status === "declined") return <ShieldX className="w-4 h-4 text-rose-500" />;
  return <ShieldAlert className="w-4 h-4 text-amber-500" />;
};

const recordTypeColors: Record<string, string> = {
  eviction: "bg-rose-100 text-rose-700",
  criminal: "bg-rose-100 text-rose-700",
  civil: "bg-amber-100 text-amber-700",
  bankruptcy: "bg-amber-100 text-amber-700",
  judgment: "bg-amber-100 text-amber-700",
};

export default async function ScreeningPage() {
  const [decisions, publicRecords, bankVerifications] = await Promise.all([
    db.verificationDecision.findMany({
      include: { applicant: true },
      orderBy: { createdAt: "desc" },
    }),
    db.publicRecordCheck.findMany({
      include: { applicant: true, rentalHistoryEntry: true },
      orderBy: { createdAt: "desc" },
    }),
    db.bankVerification.findMany({
      include: { applicant: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const flaggedRecords = publicRecords.filter(
    (r) => r.status === "hit" || r.status === "flagged"
  );
  const nsfAlerts = bankVerifications.filter((b) => b.nsfSignal);
  const manualReviewNeeded = decisions.filter((d) => d.manualReviewRequired);

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Screening</h1>
        <p className="mt-1 text-sm text-slate-500">
          Decisioning summary, public records, and bank verification results across all applicants.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total decisions",
            value: decisions.length,
            icon: <ShieldCheck className="w-5 h-5 text-slate-400" />,
            color: "bg-white",
          },
          {
            label: "Manual review needed",
            value: manualReviewNeeded.length,
            icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
            color: manualReviewNeeded.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white",
          },
          {
            label: "Public record hits",
            value: flaggedRecords.length,
            icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
            color: flaggedRecords.length > 0 ? "bg-rose-50 border-rose-200" : "bg-white",
          },
          {
            label: "NSF / bounced alerts",
            value: nsfAlerts.length,
            icon: <Landmark className="w-5 h-5 text-rose-400" />,
            color: nsfAlerts.length > 0 ? "bg-rose-50 border-rose-200" : "bg-white",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn("rounded-2xl border border-slate-200 p-4", stat.color)}
          >
            <div className="flex items-center justify-between mb-2">
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Decisions */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Verification decisions</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {decisions.length}
          </span>
        </div>

        {decisions.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="w-7 h-7 text-slate-300" />} message="No decisions recorded yet." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="hidden md:grid grid-cols-12 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <div className="col-span-3">Applicant</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Confidence</div>
              <div className="col-span-3">Summary</div>
              <div className="col-span-1">Decided by</div>
              <div className="col-span-1">Date</div>
            </div>
            {decisions.map((d) => (
              <div key={d.id} className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 border-t border-slate-100 px-5 py-4 text-sm">
                <div className="md:col-span-3 min-w-0">
                  <Link
                    href={`/applications/${d.applicant.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    {d.applicant.firstName} {d.applicant.lastName}
                  </Link>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center gap-1.5">
                    <DecisionIcon status={d.overallStatus} />
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium capitalize", decisionColors[d.overallStatus] ?? "bg-slate-100 text-slate-600")}>
                      {d.overallStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", d.confidenceScore >= 75 ? "bg-emerald-400" : d.confidenceScore >= 50 ? "bg-amber-400" : "bg-rose-400")}
                        style={{ width: `${d.confidenceScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">{d.confidenceScore}%</span>
                  </div>
                </div>
                <div className="md:col-span-3 text-xs text-slate-500 truncate">{d.summary ?? "—"}</div>
                <div className="md:col-span-1 text-xs text-slate-400">{d.decidedBy ?? "—"}</div>
                <div className="md:col-span-1 text-xs text-slate-400">{relativeTime(d.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Public Records */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FileSearch className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Public record checks</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {publicRecords.length}
          </span>
          {flaggedRecords.length > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
              {flaggedRecords.length} hit{flaggedRecords.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {publicRecords.length === 0 ? (
          <EmptyState icon={<FileSearch className="w-7 h-7 text-slate-300" />} message="No public record checks on file." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="hidden md:grid grid-cols-12 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <div className="col-span-3">Applicant</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Source</div>
              <div className="col-span-3">Summary</div>
            </div>
            {publicRecords.map((r) => (
              <div key={r.id} className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 border-t border-slate-100 px-5 py-4 text-sm">
                <div className="md:col-span-3 min-w-0">
                  {r.applicant ? (
                    <Link
                      href={`/applications/${r.applicant.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {r.applicant.firstName} {r.applicant.lastName}
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-xs italic">Unknown</span>
                  )}
                </div>
                <div className="md:col-span-2">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium capitalize", recordTypeColors[r.type] ?? "bg-slate-100 text-slate-600")}>
                    {r.type}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                    r.status === "hit" || r.status === "flagged"
                      ? "bg-rose-100 text-rose-700"
                      : r.status === "clear"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  )}>
                    {r.status}
                  </span>
                </div>
                <div className="md:col-span-2 text-xs text-slate-500">{r.source}</div>
                <div className="md:col-span-3 text-xs text-slate-500 truncate">{r.summary ?? "—"}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bank Verifications */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Bank verifications</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {bankVerifications.length}
          </span>
          {nsfAlerts.length > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
              {nsfAlerts.length} NSF alert{nsfAlerts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {bankVerifications.length === 0 ? (
          <EmptyState icon={<Landmark className="w-7 h-7 text-slate-300" />} message="No bank verifications on file." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="hidden md:grid grid-cols-12 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <div className="col-span-3">Applicant</div>
              <div className="col-span-2">Institution</div>
              <div className="col-span-2">Rent detected</div>
              <div className="col-span-2">Est. rent</div>
              <div className="col-span-2">Consistency</div>
              <div className="col-span-1">NSF</div>
            </div>
            {bankVerifications.map((b) => (
              <div key={b.id} className={cn("grid grid-cols-1 md:grid-cols-12 items-center gap-2 border-t border-slate-100 px-5 py-4 text-sm", b.nsfSignal && "bg-rose-50/40")}>
                <div className="md:col-span-3 min-w-0">
                  <Link
                    href={`/applications/${b.applicant.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    {b.applicant.firstName} {b.applicant.lastName}
                  </Link>
                  <p className="text-xs text-slate-400">{b.provider}</p>
                </div>
                <div className="md:col-span-2 text-slate-600 text-xs">{b.institutionName ?? "—"}</div>
                <div className="md:col-span-2">
                  {b.recurringRentDetected ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">No</span>
                  )}
                </div>
                <div className="md:col-span-2 text-slate-600 text-xs">
                  {b.estimatedRentAmount ? `$${b.estimatedRentAmount.toLocaleString()}/mo` : "—"}
                </div>
                <div className="md:col-span-2">
                  {b.paymentConsistencyScore != null ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", b.paymentConsistencyScore >= 75 ? "bg-emerald-400" : b.paymentConsistencyScore >= 50 ? "bg-amber-400" : "bg-rose-400")}
                          style={{ width: `${b.paymentConsistencyScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{b.paymentConsistencyScore}%</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </div>
                <div className="md:col-span-1">
                  {b.nsfSignal ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">NSF</span>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
