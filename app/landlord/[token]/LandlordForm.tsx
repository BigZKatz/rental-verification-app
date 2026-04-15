"use client";

import { useActionState, useState } from "react";
import { submitLandlordResponse, type LandlordFormState } from "./actions";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface Props {
  token: string;
  addressLine1: string;
  city: string;
  state: string;
  applicantFirstName: string;
}

const initialState: LandlordFormState = {};

function YesNo({
  name,
  value,
  onChange,
}: {
  name: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-3">
      <input type="hidden" name={name} value={value === null ? "" : String(value)} />
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 rounded-xl py-3 text-sm font-semibold border-2 transition-colors",
          value === true
            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
            : "border-slate-200 text-slate-500 hover:border-slate-300"
        )}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 rounded-xl py-3 text-sm font-semibold border-2 transition-colors",
          value === false
            ? "border-rose-400 bg-rose-50 text-rose-600"
            : "border-slate-200 text-slate-500 hover:border-slate-300"
        )}
      >
        No
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-sm font-medium text-slate-800">{children}</p>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

export default function LandlordForm({ token, addressLine1, city, state: st, applicantFirstName }: Props) {
  const boundAction = submitLandlordResponse.bind(null, token);
  const [formState, action, pending] = useActionState(boundAction, initialState);

  const [confirmedTenant, setConfirmedTenant] = useState<boolean | null>(null);
  const [wouldRentAgain, setWouldRentAgain] = useState<boolean | null>(null);
  const [hadLatePayments, setHadLatePayments] = useState<boolean | null>(null);
  const [hadViolations, setHadViolations] = useState<boolean | null>(null);
  const [hadDamage, setHadDamage] = useState<boolean | null>(null);
  const [hadBalance, setHadBalance] = useState<boolean | null>(null);

  if (formState.success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Thank you!</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-xs">
          Your response has been recorded. You can close this page.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-8">
      {/* About you */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">About you</h2>
        <Field>
          <Label>Your name *</Label>
          <input
            name="responderName"
            required
            placeholder="Full name"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <Label>Title</Label>
            <input
              name="responderTitle"
              placeholder="e.g. Owner"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <Field>
            <Label>Company</Label>
            <input
              name="responderCompany"
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
        </div>
        <Field>
          <Label>Your relationship to the property</Label>
          <select
            name="relationshipToProperty"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select one</option>
            <option value="owner">Owner</option>
            <option value="property_manager">Property Manager</option>
            <option value="leasing_agent">Leasing Agent</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </section>

      <hr className="border-slate-100" />

      {/* Core confirmation */}
      <section className="space-y-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Tenancy</h2>
        <Field>
          <Label>Did {applicantFirstName} rent from you at {addressLine1}, {city}, {st}?</Label>
          <YesNo name="confirmedTenant" value={confirmedTenant} onChange={setConfirmedTenant} />
        </Field>

        {confirmedTenant === true && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label>Move-in date</Label>
                <input
                  name="confirmedMoveInDate"
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field>
                <Label>Move-out date</Label>
                <input
                  name="confirmedMoveOutDate"
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>
            <Field>
              <Label>Monthly rent ($)</Label>
              <input
                name="confirmedMonthlyRent"
                type="number"
                min={0}
                placeholder="e.g. 1500"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </>
        )}
      </section>

      {confirmedTenant === true && (
        <>
          <hr className="border-slate-100" />

          {/* Issues */}
          <section className="space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Tenancy issues</h2>

            <Field>
              <Label>Were there any late payments?</Label>
              <YesNo name="_hadLatePayments" value={hadLatePayments} onChange={setHadLatePayments} />
            </Field>
            {hadLatePayments === true && (
              <Field>
                <Label>How many late payments?</Label>
                <input
                  name="latePaymentCount"
                  type="number"
                  min={1}
                  placeholder="e.g. 3"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            )}

            <Field>
              <Label>Any lease violations?</Label>
              <YesNo name="_hadViolations" value={hadViolations} onChange={setHadViolations} />
            </Field>
            {hadViolations === true && (
              <Field>
                <Label>Please describe</Label>
                <input
                  name="leaseViolations"
                  placeholder="Brief description"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            )}

            <Field>
              <Label>Any property damage?</Label>
              <YesNo name="_hadDamage" value={hadDamage} onChange={setHadDamage} />
            </Field>
            {hadDamage === true && (
              <Field>
                <Label>Please describe</Label>
                <input
                  name="propertyDamage"
                  placeholder="Brief description"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            )}

            <Field>
              <Label>Any balance owed?</Label>
              <YesNo name="_hadBalance" value={hadBalance} onChange={setHadBalance} />
            </Field>
            {hadBalance === true && (
              <Field>
                <Label>Amount owed ($)</Label>
                <input
                  name="balanceOwed"
                  type="number"
                  min={1}
                  placeholder="e.g. 500"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            )}

            <Field>
              <Label>Overall payment history</Label>
              <div className="grid grid-cols-4 gap-2">
                {["Excellent", "Good", "Fair", "Poor"].map((rating) => (
                  <label
                    key={rating}
                    className="relative flex cursor-pointer flex-col items-center rounded-xl border-2 border-slate-200 py-3 text-xs font-medium text-slate-600 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700"
                  >
                    <input
                      type="radio"
                      name="paymentHistoryRating"
                      value={rating.toLowerCase()}
                      className="sr-only"
                    />
                    {rating}
                  </label>
                ))}
              </div>
            </Field>
          </section>

          <hr className="border-slate-100" />

          {/* Overall */}
          <section className="space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Overall</h2>
            <Field>
              <Label>Would you rent to {applicantFirstName} again?</Label>
              <YesNo name="wouldRentAgain" value={wouldRentAgain} onChange={setWouldRentAgain} />
            </Field>
          </section>
        </>
      )}

      <hr className="border-slate-100" />

      {/* Comments */}
      <section>
        <Field>
          <Label>Anything else to add? (optional)</Label>
          <textarea
            name="comments"
            rows={3}
            placeholder="Additional comments…"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </Field>
      </section>

      {formState.error && (
        <p className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {formState.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "w-full rounded-xl py-4 text-sm font-semibold text-white transition-colors",
          pending ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        )}
      >
        {pending ? "Submitting…" : "Submit response"}
      </button>

      <p className="text-center text-xs text-slate-400 pb-6">
        Your response is confidential and used only for tenant verification purposes.
      </p>
    </form>
  );
}
