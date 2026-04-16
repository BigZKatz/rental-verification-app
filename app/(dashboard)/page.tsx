import { db } from "@/lib/db";
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  Clock3,
  ArrowRight,
  Building2,
  Files,
} from "lucide-react";
import Link from "next/link";
import { cn, relativeTime } from "@/lib/utils";

async function getStats() {
  const [totalApplicants, pendingReview, highRisk, recentApplicants] = await Promise.all([
    db.applicant.count(),
    db.applicant.count({ where: { status: { in: ["in_review", "pending_docs", "pending_landlord"] } } }),
    db.verificationDecision.count({ where: { overallStatus: "high_risk" } }),
    db.applicant.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        rentalHistory: { take: 1, orderBy: { createdAt: "desc" } },
        decisions: { take: 1, orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  const dueToday = await db.landlordVerificationRequest.count({
    where: { status: { in: ["pending", "opened"] } },
  });

  return { totalApplicants, pendingReview, highRisk, dueToday, recentApplicants };
}

const decisionColors: Record<string, string> = {
  verified: "bg-emerald-100 text-emerald-700",
  partially_verified: "bg-blue-100 text-blue-700",
  unverifiable: "bg-amber-100 text-amber-700",
  high_risk: "bg-rose-100 text-rose-700",
};

export default async function DashboardPage() {
  const { totalApplicants, pendingReview, highRisk, dueToday, recentApplicants } = await getStats();

  const stats = [
    { label: "Applications", value: totalApplicants, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending Review", value: pendingReview, icon: ShieldCheck, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "High Risk Flags", value: highRisk, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Landlord Follow-Ups", value: dueToday, icon: Clock3, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="px-4 py-5 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Rental history verification queue and applicant risk overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold leading-none text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1 truncate">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Applications</h2>
            <Link href="/applications" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentApplicants.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No applications yet</p>
              </div>
            ) : (
              recentApplicants.map((applicant) => {
                const latestDecision = applicant.decisions[0];
                const latestAddress = applicant.rentalHistory[0];
                return (
                  <Link key={applicant.id} href={`/applications/${applicant.id}`} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{applicant.firstName} {applicant.lastName}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", decisionColors[latestDecision?.overallStatus ?? "partially_verified"] ?? "bg-slate-100 text-slate-600")}>
                          {latestDecision?.overallStatus?.replaceAll("_", " ") ?? applicant.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{latestAddress ? `${latestAddress.addressLine1}, ${latestAddress.city}, ${latestAddress.state}` : "No rental history added yet"}</p>
                      <p className="text-xs text-slate-400 mt-1">{applicant.phone} · added {relativeTime(applicant.createdAt)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <ShieldCheck className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="font-semibold text-lg mb-1">Start Verification</h3>
            <p className="text-blue-100 text-sm mb-4">Review rental history, verify landlords, and surface fraud flags fast.</p>
            <Link href="/verify" className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              Open queue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Verification Workflow</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3"><Building2 className="w-4 h-4 mt-0.5 text-slate-400" /><span>Verify landlord identity and property management contacts</span></div>
              <div className="flex items-start gap-3"><Files className="w-4 h-4 mt-0.5 text-slate-400" /><span>Collect leases, ledgers, notices, and bank evidence</span></div>
              <div className="flex items-start gap-3"><AlertTriangle className="w-4 h-4 mt-0.5 text-slate-400" /><span>Score mismatches, unpaid balances, and fraud signals</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
