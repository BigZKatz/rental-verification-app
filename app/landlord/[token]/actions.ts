"use server";

import { db } from "@/lib/db";
import { sendStaffNotificationEmail } from "@/lib/email";
import { headers } from "next/headers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export type LandlordFormState = {
  error?: string;
  success?: boolean;
};

export async function submitLandlordResponse(
  token: string,
  _prev: LandlordFormState,
  formData: FormData
): Promise<LandlordFormState> {
  const headersList = await headers();
  const ip = getClientIp(headersList as unknown as Headers);
  const rl = rateLimit("landlord-form", ip, 5, 10 * 60 * 1000); // 5 per 10 min
  if (!rl.allowed) {
    return { error: "Too many submissions from this IP. Please try again later." };
  }

  const request = await db.landlordVerificationRequest.findUnique({
    where: { token },
    include: {
      rentalHistoryEntry: {
        include: { applicant: true },
      },
    },
  });

  if (!request) return { error: "This link is not valid." };
  if (request.status === "completed") return { error: "This form has already been submitted." };

  const getString = (key: string): string | null => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };

  const getBoolean = (key: string): boolean | null => {
    const v = formData.get(key);
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  };

  const getInt = (key: string): number | null => {
    const v = formData.get(key);
    if (typeof v !== "string" || v.trim() === "") return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  };

  const getDate = (key: string): Date | null => {
    const v = formData.get(key);
    if (typeof v !== "string" || v.trim() === "") return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  const responderName = getString("responderName");
  if (!responderName) return { error: "Your name is required." };

  await db.$transaction([
    db.landlordVerificationResponse.create({
      data: {
        requestId: request.id,
        responderName,
        responderTitle: getString("responderTitle"),
        responderCompany: getString("responderCompany"),
        relationshipToProperty: getString("relationshipToProperty"),
        confirmedTenant: getBoolean("confirmedTenant"),
        confirmedMoveInDate: getDate("confirmedMoveInDate"),
        confirmedMoveOutDate: getDate("confirmedMoveOutDate"),
        confirmedMonthlyRent: getInt("confirmedMonthlyRent"),
        paymentHistoryRating: getString("paymentHistoryRating"),
        latePaymentCount: getInt("latePaymentCount"),
        leaseViolations: getString("leaseViolations"),
        propertyDamage: getString("propertyDamage"),
        balanceOwed: getInt("balanceOwed"),
        wouldRentAgain: getBoolean("wouldRentAgain"),
        comments: getString("comments"),
      },
    }),
    db.landlordVerificationRequest.update({
      where: { id: request.id },
      data: { status: "completed", completedAt: new Date() },
    }),
  ]);

  // Fire staff notification — non-blocking, failure does not affect the landlord's submission
  const entry = request.rentalHistoryEntry;
  const applicant = entry.applicant;
  const host = headersList.get("host") ?? "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  await sendStaffNotificationEmail({
    applicantFirstName: applicant.firstName,
    applicantLastName: applicant.lastName,
    addressLine1: entry.addressLine1,
    city: entry.city,
    state: entry.state,
    responderName,
    applicantUrl: `${origin}/applications/${applicant.id}`,
  });

  return { success: true };
}
