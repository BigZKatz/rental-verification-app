import { db } from "@/lib/db";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import CopyLinkButton from "./CopyLinkButton";

export default async function VerifyPage() {
  const [pending, completed] = await Promise.all([
    db.landlordVerificationRequest.findMany({
      where: { status: "pending" },
      include: {
        rentalHistoryEntry: {
          include: { applicant: true },
        },
      },
      orderBy: { sentAt: "asc" }, // oldest first = most overdue
    }),
    db.landlordVerificationRequest.findMany({
      where: { status: "completed" },
      include: {
        rentalHistoryEntry: {
          include: { applicant: true },
        },
        response: true,
      },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verification Queue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Landlord requests waiting for a response, sorted by age. Re-share links as needed.
        </p>
      </div>

      {/* Pending */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-700">Awaiting response</h2>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">All caught up</p>
            <p className="text-xs text-slate-400 mt-1">No pending landlord requests.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="hidden md:grid grid-cols-12 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <div className="col-span-3">Applicant</div>
              <div className="col-span-4">Property</div>
              <div className="col-span-2">Landlord contact</div>
              <div className="col-span-2">Waiting</div>
              <div className="col-span-1" />
            </div>

            {pending.map((req) => {
              const entry = req.rentalHistoryEntry;
              const applicant = entry.applicant;
              const sentAt = req.sentAt ?? req.createdAt;
              const daysPending = Math.floor(
                (Date.now() - new Date(sentAt).getTime()) / 86_400_000
              );

              return (
                <div
                  key={req.id}
                  className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 border-t border-slate-100 px-5 py-4 text-sm"
                >
                  <div className="md:col-span-3 min-w-0">
                    <Link
                      href={`/applications/${applicant.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {applicant.firstName} {applicant.lastName}
                    </Link>
                    <p className="text-xs text-slate-400 truncate">{applicant.email ?? applicant.phone}</p>
                  </div>
                  <div className="md:col-span-4 min-w-0 text-slate-600">
                    <p className="truncate">{entry.addressLine1}</p>
                    <p className="text-xs text-slate-400">{entry.city}, {entry.state} {entry.zip}</p>
                  </div>
                  <div className="md:col-span-2 min-w-0 text-slate-500 text-xs">
                    {entry.landlordEmail ?? entry.landlordPhone ?? (
                      <span className="italic text-slate-300">No contact</span>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <span className={
                      daysPending >= 7
                        ? "text-rose-600 font-semibold text-xs"
                        : daysPending >= 3
                        ? "text-amber-600 text-xs"
                        : "text-slate-400 text-xs"
                    }>
                      {daysPending === 0 ? "Today" : `${daysPending}d ago`}
                    </span>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <CopyLinkButton token={req.token} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-700">Recently completed</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="hidden md:grid grid-cols-12 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <div className="col-span-3">Applicant</div>
              <div className="col-span-4">Property</div>
              <div className="col-span-2">Responded by</div>
              <div className="col-span-2">Would rent again</div>
              <div className="col-span-1">Completed</div>
            </div>

            {completed.map((req) => {
              const entry = req.rentalHistoryEntry;
              const applicant = entry.applicant;
              const r = req.response;

              return (
                <div
                  key={req.id}
                  className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 border-t border-slate-100 px-5 py-4 text-sm"
                >
                  <div className="md:col-span-3 min-w-0">
                    <Link
                      href={`/applications/${applicant.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {applicant.firstName} {applicant.lastName}
                    </Link>
                  </div>
                  <div className="md:col-span-4 min-w-0 text-slate-600">
                    <p className="truncate">{entry.addressLine1}</p>
                    <p className="text-xs text-slate-400">{entry.city}, {entry.state}</p>
                  </div>
                  <div className="md:col-span-2 text-slate-600 text-xs">
                    {r?.responderName ?? "—"}
                    {r?.responderTitle && <span className="text-slate-400 ml-1">· {r.responderTitle}</span>}
                  </div>
                  <div className="md:col-span-2">
                    {r?.wouldRentAgain === true && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Yes</span>
                    )}
                    {r?.wouldRentAgain === false && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">No</span>
                    )}
                    {r?.wouldRentAgain === null || r?.wouldRentAgain === undefined && (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </div>
                  <div className="md:col-span-1 text-slate-400 text-xs">
                    {req.completedAt ? relativeTime(req.completedAt) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {pending.length === 0 && completed.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-16 text-center">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            No landlord requests yet. Send one from an applicant&apos;s rental history entry.
          </p>
        </div>
      )}
    </div>
  );
}
