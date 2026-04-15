import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getEntrataApplication } from "@/lib/entrata";

/**
 * POST /api/entrata/import
 * Body: { applicationId: string }
 *
 * Fetches a leasing application from Entrata, then upserts an Applicant
 * and creates RentalHistoryEntry records in the local DB.
 *
 * Returns: { applicantId: string }
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { applicationId } = body as { applicationId?: string };
  if (!applicationId?.trim()) {
    return Response.json({ error: "applicationId is required" }, { status: 422 });
  }

  let application;
  try {
    application = await getEntrataApplication(applicationId.trim());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch from Entrata";
    return Response.json({ error: message }, { status: 502 });
  }

  const { applicant: a, rental_history, consent_provided, entrata_application_id } = application;

  if (!a.first_name || !a.last_name) {
    return Response.json({ error: "Entrata returned an application without applicant name" }, { status: 422 });
  }

  const applicantData = {
    entrataApplicationId: entrata_application_id || applicationId.trim(),
    firstName: a.first_name,
    lastName: a.last_name,
    email: a.email ?? null,
    phone: a.phone ?? "",
    dateOfBirth: a.date_of_birth ? new Date(a.date_of_birth) : null,
    ssnLast4: a.ssn_last4 ?? null,
    currentAddress: a.current_address ?? null,
    consentProvided: consent_provided,
    status: "in_review",
  };

  // Upsert by entrataApplicationId — prevents duplicates on re-import
  const savedApplicant = await db.applicant.upsert({
    where: { entrataApplicationId: applicantData.entrataApplicationId },
    create: applicantData,
    update: {
      firstName: applicantData.firstName,
      lastName: applicantData.lastName,
      email: applicantData.email,
      phone: applicantData.phone,
      dateOfBirth: applicantData.dateOfBirth,
      ssnLast4: applicantData.ssnLast4,
      currentAddress: applicantData.currentAddress,
      consentProvided: applicantData.consentProvided,
    },
  });

  // Create rental history entries (always append — allows re-import to add new entries)
  if (rental_history.length > 0) {
    await db.rentalHistoryEntry.createMany({
      data: rental_history.map((h) => ({
        applicantId: savedApplicant.id,
        addressLine1: h.address_line1,
        addressLine2: h.address_line2,
        city: h.city,
        state: h.state,
        zip: h.zip,
        landlordName: h.landlord_name,
        landlordPhone: h.landlord_phone,
        landlordEmail: h.landlord_email,
        managementCompany: h.management_company,
        monthlyRent: h.monthly_rent,
        moveInDate: h.move_in_date ? new Date(h.move_in_date) : null,
        moveOutDate: h.move_out_date ? new Date(h.move_out_date) : null,
        reasonForLeaving: h.reason_for_leaving,
        currentResidence: h.current_residence,
      })),
    });
  }

  // Audit log
  await db.auditLog.create({
    data: {
      applicantId: savedApplicant.id,
      actorType: "system",
      action: "entrata_import",
      metadata: JSON.stringify({ entrataApplicationId: applicationId }),
    },
  });

  return Response.json({ applicantId: savedApplicant.id }, { status: 200 });
}
