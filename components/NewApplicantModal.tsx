"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  ssnLast4: string;
  currentAddress: string;
  consentProvided: boolean;
}

const empty: FormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  ssnLast4: "",
  currentAddress: "",
  consentProvided: false,
};

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors";

export function NewApplicantButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        New Applicant
      </button>
      {open && <NewApplicantModal onClose={() => setOpen(false)} />}
    </>
  );
}

function NewApplicantModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          ssnLast4: form.ssnLast4 || undefined,
          currentAddress: form.currentAddress || undefined,
          consentProvided: form.consentProvided,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      router.push(`/applications/${data.id}`);
      router.refresh();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">New Applicant</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" required>
              <input
                className={inputCls}
                type="text"
                placeholder="Jane"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field label="Last name" required>
              <input
                className={inputCls}
                type="text"
                placeholder="Smith"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" required>
              <input
                className={inputCls}
                type="tel"
                placeholder="(555) 000-0000"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
              />
            </Field>
            <Field label="Email">
              <input
                className={inputCls}
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of birth">
              <input
                className={inputCls}
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
              />
            </Field>
            <Field label="SSN last 4">
              <input
                className={inputCls}
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                value={form.ssnLast4}
                onChange={(e) =>
                  set("ssnLast4", e.target.value.replace(/\D/g, "").slice(0, 4))
                }
              />
            </Field>
          </div>

          <Field label="Current address">
            <input
              className={inputCls}
              type="text"
              placeholder="123 Main St, City, ST 00000"
              value={form.currentAddress}
              onChange={(e) => set("currentAddress", e.target.value)}
            />
          </Field>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
              checked={form.consentProvided}
              onChange={(e) => set("consentProvided", e.target.checked)}
            />
            <span className="text-sm text-slate-600 leading-snug">
              Applicant has provided consent to collect and verify personal
              information.
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 border border-rose-100">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors",
                submitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Creating…" : "Create Applicant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
