import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getEntrataApplicationsSince } from "@/lib/entrata";

/**
 * POST /api/entrata/sync
 *
 * Fetches all lease applications updated since the last successful sync run
 * (or the last 24 hours if this is the first run) and upserts them.
 *
 * Protected by CRON_SECRET header. Set CRON_SECRET in your .env file and
 * include it as `Authorization: Bearer <secret>` when calling from a cron job.
 *
 * Returns: { synced: number, found: number, syncRunId: string }
 */
export async function POST(request: NextRequest) {
  // Auth check — skip if CRON_SECRET is not configured (dev mode)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Create a sync run record
  const syncRun = await db.syncRun.create({
    data: { source: "entrata", status: "running" },
  });

  // Find the last completed sync to determine the since-date
  const lastSuccess = await db.syncRun.findFirst({
    where: { source: "entrata", status: "completed" },
    orderBy: { completedAt: "desc" },
  });

  const sinceDate = lastSuccess?.completedAt
    ? new Date(lastSuccess.completedAt.getTime() - 5 * 60 * 1000) // 5-min overlap to avoid gaps
    : new Date(Date.now() - 24 * 60 * 60 * 1000); // first run: last 24 hours

  let applications;
  try {
    applications = await getEntrataApplicationsSince(sinceDate);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Entrata fetch failed";
    await db.syncRun.update({
      where: { id: syncRun.id },
      data: { status: "failed", error: message, completedAt: new Date() },
    });
    return Response.json({ error: message }, { status: 502 });
  }

  let upserted = 0;

  for (const app of applications) {
    if (!app.entrata_application_id || !app.applicant.first_name || !app.applicant.last_name) {
      continue;
    }

    const a = app.applicant;

    const applicantData = {
      entrataApplicationId: app.entrata_application_id,
      firstName: a.first_name,
      lastName: a.last_name,
      email: a.email ?? null,
      phone: a.phone ?? "",
      dateOfBirth: a.date_of_birth ? new Date(a.date_of_birth) : null,
      ssnLast4: a.ssn_last4 ?? null,
      currentAddress: a.current_address ?? null,
      consentProvided: app.consent_provided,
      status: "in_review",
    };

    try {
      const saved = await db.applicant.upsert({
        where: { entrataApplicationId: app.entrata_application_id },
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

      // Only add new rental history entries — don't duplicate on re-sync
      if (app.rental_history.length > 0) {
        const existingCount = await db.rentalHistoryEntry.count({
          where: { applicantId: saved.id },
        });

        if (existingCount === 0) {
          await db.rentalHistoryEntry.createMany({
            data: app.rental_history.map((h) => ({
              applicantId: saved.id,
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
      }

      upserted++;
    } catch {
      // Skip individual failures — log and continue
    }
  }

  await db.syncRun.update({
    where: { id: syncRun.id },
    data: {
      status: "completed",
      applicantsFound: applications.length,
      applicantsUpserted: upserted,
      completedAt: new Date(),
    },
  });

  return Response.json({
    synced: upserted,
    found: applications.length,
    syncRunId: syncRun.id,
  });
}

/**
 * GET /api/entrata/sync
 *
 * Returns the status of the most recent sync run (used by the UI banner).
 */
export async function GET() {
  const latest = await db.syncRun.findFirst({
    where: { source: "entrata" },
    orderBy: { startedAt: "desc" },
  });

  return Response.json({ latest });
}
