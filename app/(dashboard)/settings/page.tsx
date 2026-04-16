import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface Integration {
  name: string;
  description: string;
  vars: { key: string; label: string; secret?: boolean }[];
  docsUrl?: string;
}

const integrations: Integration[] = [
  {
    name: "Entrata",
    description: "Pulls applications automatically via the 30-minute auto-sync. Required for Import Application and Sync features.",
    vars: [
      { key: "ENTRATA_BASE_URL", label: "Base URL (e.g. https://property.entrata.com)" },
      { key: "ENTRATA_USERNAME", label: "API Username" },
      { key: "ENTRATA_PASSWORD", label: "API Password", secret: true },
    ],
  },
  {
    name: "Resend (Email)",
    description: "Sends landlord verification emails and staff notifications when a response is submitted.",
    vars: [
      { key: "RESEND_API_KEY", label: "API Key", secret: true },
      { key: "EMAIL_FROM", label: 'From address (default: "VerifyRent <noreply@verifyrent.com>")' },
      { key: "NOTIFY_EMAIL", label: "Staff notification email address" },
    ],
    docsUrl: "https://resend.com",
  },
  {
    name: "Google OAuth",
    description: "Required for staff login. Create credentials at Google Cloud Console.",
    vars: [
      { key: "AUTH_SECRET", label: "Auth secret (run: npx auth secret)", secret: true },
      { key: "AUTH_GOOGLE_ID", label: "Google OAuth Client ID", secret: true },
      { key: "AUTH_GOOGLE_SECRET", label: "Google OAuth Client Secret", secret: true },
    ],
  },
  {
    name: "Sync Security",
    description: "Protects the /api/entrata/sync endpoint from unauthorized triggers. Required in production.",
    vars: [
      { key: "CRON_SECRET", label: "Bearer token for cron job auth", secret: true },
    ],
  },
];

function StatusPill({ configured }: { configured: boolean }) {
  if (configured) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="w-3 h-3" />
        Configured
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <XCircle className="w-3 h-3" />
      Not set
    </span>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Integration status and environment variable reference. Edit credentials in your <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.env</code> file and redeploy.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Credentials are read from environment variables and cannot be edited through the UI. Add missing values to your <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">.env</code> file (or your hosting provider's env settings) and restart the server.
        </p>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => {
          const varStatuses = integration.vars.map((v) => ({
            ...v,
            value: process.env[v.key],
            configured: !!process.env[v.key],
          }));
          const allConfigured = varStatuses.every((v) => v.configured);
          const someConfigured = varStatuses.some((v) => v.configured);

          return (
            <div key={integration.name} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{integration.name}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{integration.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {allConfigured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready
                    </span>
                  ) : someConfigured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      <AlertCircle className="w-3 h-3" />
                      Incomplete
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                      <XCircle className="w-3 h-3" />
                      Not configured
                    </span>
                  )}
                </div>
              </div>

              <div className="divide-y divide-slate-50">
                {varStatuses.map((v) => (
                  <div key={v.key} className="flex items-center justify-between px-6 py-3">
                    <div className="flex-1 min-w-0">
                      <code className="text-xs font-mono font-semibold text-slate-700">{v.key}</code>
                      <p className="text-xs text-slate-400 mt-0.5">{v.label}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {v.configured && !v.secret && (
                        <span className="text-xs text-slate-400 truncate max-w-[180px]">{v.value}</span>
                      )}
                      <StatusPill configured={v.configured} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
