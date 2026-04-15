import { db } from "@/lib/db";
import { ShieldCheck } from "lucide-react";
import LandlordForm from "./LandlordForm";

export default async function LandlordVerificationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const request = await db.landlordVerificationRequest.findUnique({
    where: { token },
    include: {
      rentalHistoryEntry: {
        include: { applicant: true },
      },
      response: true,
    },
  });

  if (!request) {
    return (
      <Shell>
        <div className="text-center py-16">
          <p className="text-lg font-semibold text-slate-900">Link not found</p>
          <p className="mt-2 text-sm text-slate-500">This verification link is invalid or has expired.</p>
        </div>
      </Shell>
    );
  }

  if (request.status === "completed" || request.response) {
    return (
      <Shell>
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-slate-900">Already submitted</p>
          <p className="mt-2 text-sm text-slate-500">This form has already been completed. Thank you!</p>
        </div>
      </Shell>
    );
  }

  const { rentalHistoryEntry: entry } = request;
  const applicantFirstName = entry.applicant.firstName;

  return (
    <Shell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Rental verification</p>
        <h1 className="text-xl font-bold text-slate-900">
          {entry.addressLine1}, {entry.city}, {entry.state}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          You&apos;ve been asked to verify a tenancy for {applicantFirstName}.
          This takes about 2 minutes to complete.
        </p>
      </div>

      <LandlordForm
        token={token}
        addressLine1={entry.addressLine1}
        city={entry.city}
        state={entry.state}
        applicantFirstName={applicantFirstName}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900">VerifyRent</span>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-8">{children}</main>
    </div>
  );
}
