import {
  clearAdminSessionToken,
  getAdminSessionToken,
  notifyAdminSessionExpired,
} from "@/lib/admin-auth";
import type {
  AdminErrorMessage,
  AdminRequestOtpPayload,
  AdminRequestOtpResult,
  AdminSuccessMessage,
  AdminVerifyOtpPayload,
  AdminVerifyOtpResult,
} from "@/lib/admin-types";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api/v1"
)
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/$/, "");

export const ADMIN_API_PREFIX = "/ops-e246f9e101aae83bee9e9600";

export class AdminApiError extends Error {
  code: number;
  details?: unknown;

  constructor(message: string, code: number, details?: unknown) {
    super(message);
    this.name = "AdminApiError";
    this.code = code;
    this.details = details;
  }
}

type AdminRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

function isErrorEnvelope(body: unknown): body is AdminErrorMessage {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;

  if (record.status === "error") return true;
  return (
    typeof record.status === "number" &&
    record.status >= 400 &&
    !record.data
  );
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

function getErrorMessage(parsed: unknown, fallback: string): string {
  if (
    parsed &&
    typeof parsed === "object" &&
    "message" in parsed &&
    typeof (parsed as { message: unknown }).message === "string"
  ) {
    return (parsed as { message: string }).message;
  }

  return fallback;
}

function getErrorDetails(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== "object") return undefined;
  const error = parsed as AdminErrorMessage;
  return error.details ?? error.data ?? error.detail;
}

export async function adminApiRequest<T>(
  path: string,
  options: AdminRequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAdminSessionToken();
    if (!token) {
      throw new AdminApiError("Admin session required", 401);
    }
    requestHeaders.set("X-Admin-Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_ORIGIN}${ADMIN_API_PREFIX}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const parsed = await parseResponse(response);

  const envelopeCode =
    parsed &&
    typeof parsed === "object" &&
    "code" in parsed &&
    typeof (parsed as { code: unknown }).code === "number"
      ? (parsed as { code: number }).code
      : response.status;

  const hiddenAuthFailure =
    response.status === 404 &&
    parsed !== null &&
    typeof parsed === "object" &&
    (parsed as { status?: unknown }).status === 404;

  if (
    auth &&
    (response.status === 401 || envelopeCode === 401 || hiddenAuthFailure)
  ) {
    clearAdminSessionToken();
    notifyAdminSessionExpired();
  }

  if (isErrorEnvelope(parsed)) {
    throw new AdminApiError(
      parsed.message ?? "Admin request failed",
      envelopeCode,
      getErrorDetails(parsed),
    );
  }

  if (!response.ok) {
    throw new AdminApiError(
      getErrorMessage(parsed, "Admin request failed"),
      envelopeCode,
      getErrorDetails(parsed),
    );
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "data" in parsed &&
    (parsed as AdminSuccessMessage<T>).data !== undefined
  ) {
    return (parsed as AdminSuccessMessage<T>).data as T;
  }

  return parsed as T;
}

export const adminApi = {
  auth: {
    requestOtp: async (payload: AdminRequestOtpPayload) =>
      (await adminApiRequest<AdminRequestOtpResult | null>("/auth/request-otp", {
        method: "POST",
        body: payload,
        auth: false,
      })) ?? {},
    verifyOtp: (payload: AdminVerifyOtpPayload) =>
      adminApiRequest<AdminVerifyOtpResult>("/auth/verify-otp", {
        method: "POST",
        body: payload,
        auth: false,
      }),
  },
};

export function readAdminToken(result: AdminVerifyOtpResult): string | null {
  return (
    result.admin_session_token ??
    result.session_token ??
    result.access_token ??
    result.token ??
    null
  );
}
