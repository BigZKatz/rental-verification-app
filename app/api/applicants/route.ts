import { db } from "@/lib/db";
import { NextRequest } from "next/server";

interface NewApplicantBody {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  ssnLast4?: string;
  currentAddress?: string;
  consentProvided: boolean;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = body as NewApplicantBody;

  if (!data.firstName?.trim()) {
    return Response.json({ error: "First name is required" }, { status: 422 });
  }
  if (!data.lastName?.trim()) {
    return Response.json({ error: "Last name is required" }, { status: 422 });
  }
  if (!data.phone?.trim()) {
    return Response.json({ error: "Phone is required" }, { status: 422 });
  }
  // Accept E.164, US local (10-digit), or 11-digit with leading 1
  if (!/^\+?1?\d{10,14}$/.test(data.phone.replace(/[\s\-().]/g, ""))) {
    return Response.json({ error: "Phone number format is invalid" }, { status: 422 });
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    return Response.json({ error: "Email address format is invalid" }, { status: 422 });
  }

  const applicant = await db.applicant.create({
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      ssnLast4: data.ssnLast4?.trim() || null,
      currentAddress: data.currentAddress?.trim() || null,
      consentProvided: Boolean(data.consentProvided),
    },
  });

  return Response.json({ id: applicant.id }, { status: 201 });
}
