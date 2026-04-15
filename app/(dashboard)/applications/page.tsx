import { db } from "@/lib/db";
import Link from "next/link";
import { cn, relativeTime } from "@/lib/utils";
import { NewApplicantButton } from "@/components/NewApplicantModal";
import ImportApplicationButton from "./ImportApplicationButton";
import SyncStatusBanner from "./SyncStatusBanner";

const statusColors: Record<string, string> = {
  in_review: "bg-blue-100 text-blue-700",
  pending_docs: "bg-amber-100 text-amber-700",
  pending_landlord: "bg-violet-100 text-violet-700",
  flagged: "bg-rose-100 text-rose-700",
  approved: "bg-emerald-100 text-emerald-700",
};

export default async function ApplicationsPage() {
  const applicants = await db.applicant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rentalHistory: { take: 1, orderBy: { createdAt: "desc" } },
      findings: true,
      decisions: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="mt-1 text-sm text-slate-500">All applicants and their current rental verification status.</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportApplicationButton />
          <NewApplicantButton />
        </div>
      </div>

      <SyncStatusBanner />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-12 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div className="col-span-3">Applicant</div>
          <div className="col-span-3">Latest address</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Findings</div>
          <div className="col-span-2">Updated</div>
        </div>
        {applicants.map((applicant) => {
          const latestAddress = applicant.rentalHistory[0];
          const latestDecision = applicant.decisions[0];
          const status = latestDecision?.overallStatus ?? applicant.status;
          return (
            <Link
              key={applicant.id}
              href={`/applications/${applicant.id}`}
              className="grid grid-cols-12 items-center gap-3 border-t border-slate-100 px-5 py-4 text-sm hover:bg-slate-50"
            >
              <div className="col-span-3 min-w-0">
                <p className="font-semibold text-slate-900">{applicant.firstName} {applicant.lastName}</p>
                <p className="truncate text-xs text-slate-400">{applicant.email ?? applicant.phone}</p>
              </div>
              <div className="col-span-3 min-w-0 text-slate-600">
                {latestAddress ? `${latestAddress.addressLine1}, ${latestAddress.city}` : "No rental history yet"}
              </div>
              <div className="col-span-2">
                <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-medium", statusColors[status] ?? "bg-slate-100 text-slate-700")}>
                  {status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="col-span-2 text-slate-600">{applicant.findings.length}</div>
              <div className="col-span-2 text-slate-400">{relativeTime(applicant.updatedAt)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
