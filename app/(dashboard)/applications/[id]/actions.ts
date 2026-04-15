"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendLandlordVerificationEmail } from "@/lib/email";

export type RentalHistoryFormState = {
  error?: string;
  success?: boolean;
};

export async function createRentalHistoryEntry(
  _prev: RentalHistoryFormState,
  formData: FormData
): Promise<RentalHistoryFormState> {
  const applicantId = formData.get("applicantId");
  if (typeof applicantId !== "string" || !applicantId) {
    return { error: "Missing applicant ID." };
  }

  const applicant = await db.applicant.findUnique({ where: { id: applicantId } });
  if (!applicant) return { error: "Applicant not found." };

  const addressLine1 = formData.get("addressLine1");
  const city = formData.get("city");
  const state = formData.get("state");
  const zip = formData.get("zip");

  if (
    typeof addressLine1 !== "string" || !addressLine1.trim() ||
    typeof city !== "string" || !city.trim() ||
    typeof state !== "string" || !state.trim() ||
    typeof zip !== "string" || !zip.trim()
  ) {
    return { error: "Address line 1, city, state, and zip are required." };
  }

  const rawRent = formData.get("monthlyRent");
  const monthlyRent =
    typeof rawRent === "string" && rawRent.trim() !== ""
      ? parseInt(rawRent, 10)
      : null;
  if (monthlyRent !== null && (isNaN(monthlyRent) || monthlyRent < 0)) {
    return { error: "Monthly rent must be a positive number." };
  }

  const rawMoveIn = formData.get("moveInDate");
  const moveInDate =
    typeof rawMoveIn === "string" && rawMoveIn.trim() !== ""
      ? new Date(rawMoveIn)
      : null;

  const rawMoveOut = formData.get("moveOutDate");
  const moveOutDate =
    typeof rawMoveOut === "string" && rawMoveOut.trim() !== ""
      ? new Date(rawMoveOut)
      : null;

  const getString = (key: string): string | null => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };

  await db.rentalHistoryEntry.create({
    data: {
      applicantId,
      addressLine1: addressLine1.trim(),
      addressLine2: getString("addressLine2"),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      landlordName: getString("landlordName"),
      landlordPhone: getString("landlordPhone"),
      landlordEmail: getString("landlordEmail"),
      managementCompany: getString("managementCompany"),
      monthlyRent,
      moveInDate,
      moveOutDate,
      reasonForLeaving: getString("reasonForLeaving"),
      currentResidence: formData.get("currentResidence") === "true",
    },
  });

  revalidatePath(`/applications/${applicantId}`);
  return { success: true };
}

export async function deleteRentalHistoryEntry(
  entryId: string,
  applicantId: string
): Promise<void> {
  await db.rentalHistoryEntry.delete({ where: { id: entryId } });
  revalidatePath(`/applications/${applicantId}`);
}

export type CreateVerificationRequestResult =
  | { token: string; emailSent: boolean; emailAddress: string | null }
  | { error: string };

export async function createVerificationRequest(
  entryId: string,
  applicantId: string,
  origin?: string
): Promise<CreateVerificationRequestResult> {
  const entry = await db.rentalHistoryEntry.findUnique({
    where: { id: entryId },
    include: { applicant: true },
  });
  if (!entry) return { error: "Rental history entry not found." };

  const token = crypto.randomUUID();
  const landlordEmail = entry.landlordEmail ?? null;

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.landlordVerificationRequest.create({
    data: {
      rentalHistoryEntryId: entryId,
      outreachChannel: landlordEmail ? "email" : "link",
      sentTo: landlordEmail ?? entry.landlordPhone ?? "unknown",
      token,
      status: "pending",
      sentAt: new Date(),
      expiresAt,
    },
  });

  let emailSent = false;
  if (landlordEmail && origin) {
    const verificationUrl = `${origin}/landlord/${token}`;
    emailSent = await sendLandlordVerificationEmail({
      to: landlordEmail,
      addressLine1: entry.addressLine1,
      city: entry.city,
      state: entry.state,
      applicantFirstName: entry.applicant.firstName,
      verificationUrl,
    });
  }

  revalidatePath(`/applications/${applicantId}`);
  return { token, emailSent, emailAddress: landlordEmail };
}
