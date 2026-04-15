import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const db = new PrismaClient({ adapter });

async function main() {
  await db.auditLog.deleteMany();
  await db.verificationDecision.deleteMany();
  await db.verificationFinding.deleteMany();
  await db.bankVerification.deleteMany();
  await db.publicRecordCheck.deleteMany();
  await db.landlordVerificationResponse.deleteMany();
  await db.landlordVerificationRequest.deleteMany();
  await db.landlordContactVerification.deleteMany();
  await db.addressVerification.deleteMany();
  await db.uploadedDocument.deleteMany();
  await db.rentalHistoryEntry.deleteMany();
  await db.applicant.deleteMany();

  const alex = await db.applicant.create({
    data: {
      firstName: "Alex",
      lastName: "Morrison",
      email: "alex@example.com",
      phone: "(512) 555-0111",
      currentAddress: "821 Westover Ave, Austin, TX 78704",
      consentProvided: true,
      status: "in_review",
      rentalHistory: {
        create: [
          {
            addressLine1: "821 Westover Ave",
            city: "Austin",
            state: "TX",
            zip: "78704",
            landlordName: "Westover Residential",
            landlordPhone: "(512) 555-1020",
            monthlyRent: 1850,
            moveInDate: new Date("2024-01-01"),
            moveOutDate: new Date("2025-12-31"),
            currentResidence: true,
          },
        ],
      },
      findings: {
        create: [
          {
            category: "document",
            severity: "warning",
            code: "missing_ledger",
            message: "Rent ledger has not been uploaded yet.",
            source: "system",
            confidence: 72,
          },
        ],
      },
      decisions: {
        create: {
          overallStatus: "partially_verified",
          confidenceScore: 74,
          manualReviewRequired: true,
          summary: "Identity and address match look good, but landlord confirmation is still pending.",
          decidedBy: "system",
        },
      },
      auditLogs: {
        create: {
          actorType: "system",
          action: "application_created",
          metadata: JSON.stringify({ source: "seed" }),
        },
      },
    },
  });

  const brianna = await db.applicant.create({
    data: {
      firstName: "Brianna",
      lastName: "Lee",
      email: "brianna@example.com",
      phone: "(737) 555-0188",
      currentAddress: "1402 Cedar Ridge Dr, Round Rock, TX 78664",
      consentProvided: true,
      status: "pending_landlord",
      rentalHistory: {
        create: [
          {
            addressLine1: "1402 Cedar Ridge Dr",
            city: "Round Rock",
            state: "TX",
            zip: "78664",
            landlordName: "Cedar Ridge Holdings",
            landlordEmail: "leasing@cedarridge.example.com",
            monthlyRent: 1625,
            moveInDate: new Date("2023-05-01"),
            moveOutDate: new Date("2025-04-01"),
          },
        ],
      },
      findings: {
        create: [
          {
            category: "landlord",
            severity: "info",
            code: "awaiting_response",
            message: "Landlord outreach sent, response not yet completed.",
            source: "workflow",
            confidence: 55,
          },
        ],
      },
      decisions: {
        create: {
          overallStatus: "partially_verified",
          confidenceScore: 66,
          manualReviewRequired: true,
          summary: "Application is waiting on landlord verification response.",
          decidedBy: "system",
        },
      },
    },
  });

  const carlos = await db.applicant.create({
    data: {
      firstName: "Carlos",
      lastName: "Reyes",
      email: "carlos@example.com",
      phone: "(512) 555-0191",
      currentAddress: "301 Barton Springs Rd, Austin, TX 78704",
      consentProvided: true,
      status: "flagged",
      rentalHistory: {
        create: [
          {
            addressLine1: "301 Barton Springs Rd",
            city: "Austin",
            state: "TX",
            zip: "78704",
            landlordName: "Unknown",
            landlordPhone: "(512) 555-0000",
            monthlyRent: 2100,
            moveInDate: new Date("2024-02-01"),
            moveOutDate: new Date("2025-02-01"),
          },
        ],
      },
      findings: {
        create: [
          {
            category: "fraud",
            severity: "critical",
            code: "landlord_contact_mismatch",
            message: "Claimed landlord contact does not match property ownership records.",
            source: "ownership_lookup",
            confidence: 91,
          },
          {
            category: "public_record",
            severity: "warning",
            code: "prior_balance_owed",
            message: "Prior landlord reported an unpaid balance at move-out.",
            source: "screening_vendor",
            confidence: 83,
          },
        ],
      },
      decisions: {
        create: {
          overallStatus: "high_risk",
          confidenceScore: 31,
          manualReviewRequired: true,
          summary: "Significant mismatch between claimed landlord contact and ownership data, plus prior balance owed.",
          decidedBy: "system",
        },
      },
    },
  });

  const briannaEntry = await db.rentalHistoryEntry.findFirstOrThrow({ where: { applicantId: brianna.id } });
  await db.landlordVerificationRequest.create({
    data: {
      rentalHistoryEntryId: briannaEntry.id,
      outreachChannel: "email",
      sentTo: "leasing@cedarridge.example.com",
      token: "seed-brianna-landlord-token",
      status: "opened",
      sentAt: new Date(),
    },
  });

  const carlosEntry = await db.rentalHistoryEntry.findFirstOrThrow({ where: { applicantId: carlos.id } });
  await db.landlordContactVerification.create({
    data: {
      rentalHistoryEntryId: carlosEntry.id,
      claimedName: "Unknown",
      claimedPhone: "(512) 555-0000",
      verifiedOwnerName: "Barton Holdings LLC",
      verifiedPhone: "(512) 555-7878",
      source: "county_assessor",
      confidenceScore: 91,
      suspicious: true,
      notes: "Applicant-provided contact does not match county or business records.",
    },
  });

  const alexEntry = await db.rentalHistoryEntry.findFirstOrThrow({ where: { applicantId: alex.id } });
  await db.addressVerification.create({
    data: {
      rentalHistoryEntryId: alexEntry.id,
      source: "bureau_address_history",
      normalizedAddress: "821 WESTOVER AVE, AUSTIN, TX 78704",
      matchScore: 96,
      matched: true,
    },
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
