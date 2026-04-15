"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createRentalHistoryEntry, type RentalHistoryFormState } from "./actions";
import { PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const initialState: RentalHistoryFormState = {};

export default function AddRentalHistoryForm({ applicantId }: { applicantId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createRentalHistoryEntry, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div className="mt-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700 w-full justify-center"
        >
          <PlusCircle className="w-4 h-4" />
          Add rental history entry
        </button>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">New rental history entry</h3>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form ref={formRef} action={action} className="space-y-4">
            <input type="hidden" name="applicantId" value={applicantId} />

            {/* Address */}
            <fieldset>
              <legend className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                Address
              </legend>
              <div className="space-y-2">
                <input
                  name="addressLine1"
                  required
                  placeholder="Street address *"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="addressLine2"
                  placeholder="Apt, suite, unit (optional)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    name="city"
                    required
                    placeholder="City *"
                    className="col-span-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    name="state"
                    required
                    placeholder="State *"
                    maxLength={2}
                    className="col-span-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    name="zip"
                    required
                    placeholder="ZIP *"
                    className="col-span-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </fieldset>

            {/* Landlord */}
            <fieldset>
              <legend className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                Landlord / Management
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="landlordName"
                  placeholder="Landlord name"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="managementCompany"
                  placeholder="Management company"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="landlordPhone"
                  type="tel"
                  placeholder="Landlord phone"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="landlordEmail"
                  type="email"
                  placeholder="Landlord email"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </fieldset>

            {/* Tenancy details */}
            <fieldset>
              <legend className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                Tenancy details
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Move-in date</label>
                  <input
                    name="moveInDate"
                    type="date"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Move-out date</label>
                  <input
                    name="moveOutDate"
                    type="date"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Monthly rent ($)</label>
                  <input
                    name="monthlyRent"
                    type="number"
                    min={0}
                    placeholder="e.g. 1500"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="currentResidence"
                      value="true"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Current residence
                  </label>
                </div>
              </div>
              <input
                name="reasonForLeaving"
                placeholder="Reason for leaving (optional)"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </fieldset>

            {state.error && (
              <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                {state.error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className={cn(
                  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors",
                  pending ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"
                )}
              >
                {pending ? "Saving…" : "Save entry"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
