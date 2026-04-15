/**
 * Entrata API client
 *
 * Entrata uses a JSON-RPC-style POST API where auth credentials and the method
 * call are all embedded in the request body.
 *
 * Required env vars:
 *   ENTRATA_DOMAIN   — your Entrata subdomain, e.g. "mycompany" → mycompany.entrata.com
 *   ENTRATA_USERNAME — API username
 *   ENTRATA_PASSWORD — API password
 *
 * Entrata API docs: https://sandbox.entrata.com/api/documentation
 */

const ENTRATA_DOMAIN = process.env.ENTRATA_DOMAIN;
const ENTRATA_USERNAME = process.env.ENTRATA_USERNAME;
const ENTRATA_PASSWORD = process.env.ENTRATA_PASSWORD;

function baseUrl() {
  if (!ENTRATA_DOMAIN) throw new Error("ENTRATA_DOMAIN is not set");
  return `https://${ENTRATA_DOMAIN}.entrata.com/api/v1`;
}

function auth() {
  if (!ENTRATA_USERNAME || !ENTRATA_PASSWORD) {
    throw new Error("ENTRATA_USERNAME or ENTRATA_PASSWORD is not set");
  }
  return { type: "basic", username: ENTRATA_USERNAME, password: ENTRATA_PASSWORD };
}

async function entrataPost<T>(endpoint: string, methodName: string, params: Record<string, unknown>): Promise<T> {
  const url = `${baseUrl()}/${endpoint}`;
  const body = {
    auth: auth(),
    requestId: Date.now().toString(),
    method: { name: methodName, params },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Entrata API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as { response?: { result?: T; error?: { message: string } } };
  if (json.response?.error) {
    throw new Error(`Entrata error: ${json.response.error.message}`);
  }

  return json.response?.result as T;
}

// ---------------------------------------------------------------------------
// Types — modeled after Entrata's leasing application response shape
// ---------------------------------------------------------------------------

export interface EntrataApplicant {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  ssn_last4: string | null;
  current_address: string | null;
}

export interface EntrataRentalHistory {
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  landlord_name: string | null;
  landlord_phone: string | null;
  landlord_email: string | null;
  management_company: string | null;
  monthly_rent: number | null;
  move_in_date: string | null;   // ISO date string
  move_out_date: string | null;  // ISO date string
  reason_for_leaving: string | null;
  current_residence: boolean;
}

export interface EntrataApplication {
  entrata_application_id: string;
  applicant: EntrataApplicant;
  rental_history: EntrataRentalHistory[];
  consent_provided: boolean;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/**
 * Fetch all leasing applications updated since a given date.
 *
 * Entrata endpoint: POST /leases  method: getLeaseApplications
 *
 * The `updatedAfter` filter uses Entrata's lastModifiedDate param.
 * Adjust the param key if your Entrata instance uses a different name.
 */
export async function getEntrataApplicationsSince(sinceDate: Date): Promise<EntrataApplication[]> {
  interface RawResult {
    LeaseApplications?: {
      LeaseApplication?: RawLeaseApplication[];
    };
  }

  interface RawLeaseApplication {
    LeaseApplicationId?: string;
    CustomerInfo?: {
      FirstName?: string;
      LastName?: string;
      Email?: string;
      Phone?: string;
      DateOfBirth?: string;
      SsnLast4?: string;
      CurrentAddress?: string;
    };
    RentalHistory?: RawHistory[];
    ConsentProvided?: boolean | string;
  }

  interface RawHistory {
    AddressLine1?: string;
    AddressLine2?: string;
    City?: string;
    State?: string;
    Zip?: string;
    LandlordName?: string;
    LandlordPhone?: string;
    LandlordEmail?: string;
    ManagementCompany?: string;
    MonthlyRent?: number | string;
    MoveInDate?: string;
    MoveOutDate?: string;
    ReasonForLeaving?: string;
    CurrentResidence?: boolean | string;
  }

  // Entrata date filter — common param names vary. If your instance uses
  // "updatedAfter" or "dateRange" instead, update the key here.
  const sinceDateStr = sinceDate.toISOString().split("T")[0]; // YYYY-MM-DD

  const result = await entrataPost<RawResult>(
    "leases",
    "getLeaseApplications",
    {
      lastModifiedDate: sinceDateStr,
      paging: { recordsPerPage: 200, requestedPage: 1 },
    }
  );

  const applications = result?.LeaseApplications?.LeaseApplication ?? [];

  return applications.map((raw) => {
    const info = raw.CustomerInfo ?? {};
    return {
      entrata_application_id: raw.LeaseApplicationId ?? "",
      consent_provided: raw.ConsentProvided === true || raw.ConsentProvided === "true",
      applicant: {
        first_name: info.FirstName ?? "",
        last_name: info.LastName ?? "",
        email: info.Email ?? null,
        phone: info.Phone ?? null,
        date_of_birth: info.DateOfBirth ?? null,
        ssn_last4: info.SsnLast4 ?? null,
        current_address: info.CurrentAddress ?? null,
      },
      rental_history: ((raw.RentalHistory ?? []) as RawHistory[]).map((h) => ({
        address_line1: h.AddressLine1 ?? "",
        address_line2: h.AddressLine2 ?? null,
        city: h.City ?? "",
        state: h.State ?? "",
        zip: h.Zip ?? "",
        landlord_name: h.LandlordName ?? null,
        landlord_phone: h.LandlordPhone ?? null,
        landlord_email: h.LandlordEmail ?? null,
        management_company: h.ManagementCompany ?? null,
        monthly_rent: h.MonthlyRent ? Number(h.MonthlyRent) : null,
        move_in_date: h.MoveInDate ?? null,
        move_out_date: h.MoveOutDate ?? null,
        reason_for_leaving: h.ReasonForLeaving ?? null,
        current_residence: h.CurrentResidence === true || h.CurrentResidence === "true",
      })),
    };
  });
}

/**
 * Fetch a single leasing application by ID from Entrata.
 *
 * Entrata endpoint: POST /leases  method: getLeaseApplications
 *
 * Note: Entrata's actual field names vary by configuration. The mapping below
 * reflects the common Entrata leasing application schema. Adjust field paths
 * to match your specific Entrata property configuration if they differ.
 */
export async function getEntrataApplication(applicationId: string): Promise<EntrataApplication> {
  interface RawResult {
    LeaseApplications?: {
      LeaseApplication?: RawLeaseApplication[];
    };
  }

  interface RawLeaseApplication {
    LeaseApplicationId?: string;
    CustomerInfo?: {
      FirstName?: string;
      LastName?: string;
      Email?: string;
      Phone?: string;
      DateOfBirth?: string;
      SsnLast4?: string;
      CurrentAddress?: string;
    };
    RentalHistory?: RawHistory[];
    ConsentProvided?: boolean | string;
  }

  interface RawHistory {
    AddressLine1?: string;
    AddressLine2?: string;
    City?: string;
    State?: string;
    Zip?: string;
    LandlordName?: string;
    LandlordPhone?: string;
    LandlordEmail?: string;
    ManagementCompany?: string;
    MonthlyRent?: number | string;
    MoveInDate?: string;
    MoveOutDate?: string;
    ReasonForLeaving?: string;
    CurrentResidence?: boolean | string;
  }

  const result = await entrataPost<RawResult>(
    "leases",
    "getLeaseApplications",
    { leaseApplicationId: applicationId }
  );

  const raw = result?.LeaseApplications?.LeaseApplication?.[0];
  if (!raw) {
    throw new Error(`Application ${applicationId} not found in Entrata`);
  }

  const info = raw.CustomerInfo ?? {};

  return {
    entrata_application_id: raw.LeaseApplicationId ?? applicationId,
    consent_provided: raw.ConsentProvided === true || raw.ConsentProvided === "true",
    applicant: {
      first_name: info.FirstName ?? "",
      last_name: info.LastName ?? "",
      email: info.Email ?? null,
      phone: info.Phone ?? null,
      date_of_birth: info.DateOfBirth ?? null,
      ssn_last4: info.SsnLast4 ?? null,
      current_address: info.CurrentAddress ?? null,
    },
    rental_history: (raw.RentalHistory ?? []).map((h) => ({
      address_line1: h.AddressLine1 ?? "",
      address_line2: h.AddressLine2 ?? null,
      city: h.City ?? "",
      state: h.State ?? "",
      zip: h.Zip ?? "",
      landlord_name: h.LandlordName ?? null,
      landlord_phone: h.LandlordPhone ?? null,
      landlord_email: h.LandlordEmail ?? null,
      management_company: h.ManagementCompany ?? null,
      monthly_rent: h.MonthlyRent ? Number(h.MonthlyRent) : null,
      move_in_date: h.MoveInDate ?? null,
      move_out_date: h.MoveOutDate ?? null,
      reason_for_leaving: h.ReasonForLeaving ?? null,
      current_residence: h.CurrentResidence === true || h.CurrentResidence === "true",
    })),
  };
}
