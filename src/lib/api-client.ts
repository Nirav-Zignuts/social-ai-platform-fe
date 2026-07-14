import type {
  AIConfiguration,
  AIConfigurationUpsert,
  AuthTokens,
  BusinessProfile,
  BusinessProfileUpsert,
  GeneratedPost,
  GeneratedPostDetail,
  InstagramConnectionStatus,
  KnowledgeDocument,
  Notification,
  User,
  Workspace,
  WorkspaceCreate,
  WorkspaceUpdate,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export function getGoogleLoginUrl(options?: { postAuthRedirect?: string }): string {
  const loginUrl = new URL("/login", typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  if (options?.postAuthRedirect) {
    loginUrl.searchParams.set("redirect", options.postAuthRedirect);
  }
  const params = new URLSearchParams({
    redirect_url: loginUrl.toString(),
  });
  return `${API_BASE}/auth/google/login?${params.toString()}`;
}

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

export class ApiError extends Error {
  code: number;
  details?: unknown;

  constructor(message: string, code: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

export class SessionExpiredError extends ApiError {
  constructor(message = "Session expired. Please sign in again.") {
    super(message, 401);
    this.name = "SessionExpiredError";
  }
}

type SuccessEnvelope<T> = {
  status: "success" | number;
  message: string;
  data?: T;
  code?: number;
};

type ErrorEnvelope = {
  status: "error" | number;
  message: string;
  code?: number;
  details?: unknown;
  data?: unknown;
};

function isErrorEnvelope(body: unknown): body is ErrorEnvelope {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  if (record.status === "error") return true;
  if (
    typeof record.status === "number" &&
    record.status >= 400 &&
    !record.data
  ) {
    return true;
  }
  return false;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function hasStoredSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getAccessToken() || getRefreshToken());
}

export function setTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Best-effort server logout using a captured access token (tokens may already be cleared). */
export async function revokeServerSession(accessToken: string | null): Promise<void> {
  if (!accessToken) return;
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
  } catch {
    // Ignore network / server errors — local session is already cleared by the caller.
  }
}

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener) {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function notifySessionExpired() {
  sessionExpiredListeners.forEach((listener) => listener());
}

function expireSession() {
  clearTokens();
  notifySessionExpired();
}

let refreshPromise: Promise<string> | null = null;

/** Decode JWT payload without verification — used only for expiry check. */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

function isAccessTokenExpired(token: string, bufferSeconds = 30): boolean {
  const exp = getTokenExpiry(token);
  if (!exp) return false;
  return Date.now() >= (exp - bufferSeconds) * 1000;
}

async function callRefreshEndpoint(refreshToken: string): Promise<string> {
  const response = await fetch(
    `${API_BASE}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`,
    { method: "POST" },
  );

  let parsed: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    parsed = await response.json();
  } else {
    parsed = await response.text();
  }

  if (
    !response.ok ||
    (typeof parsed === "object" &&
      parsed !== null &&
      isErrorEnvelope(parsed))
  ) {
    const message =
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : "Refresh token invalid or expired";
    throw new SessionExpiredError(message);
  }

  const envelope = parsed as SuccessEnvelope<{
    access_token: string;
    token_type: string;
  }>;

  const accessToken = envelope.data?.access_token;
  if (!accessToken) {
    throw new SessionExpiredError("No access token returned from refresh");
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  return accessToken;
}

/** Refresh access token using stored refresh_token. Dedupes concurrent calls. */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    expireSession();
    throw new SessionExpiredError();
  }

  if (!refreshPromise) {
    refreshPromise = callRefreshEndpoint(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function getValidAccessToken(): Promise<string | null> {
  let accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  // Prefer a still-valid access token without requiring refresh.
  if (accessToken && !isAccessTokenExpired(accessToken)) {
    return accessToken;
  }

  if (!refreshToken) {
    return null;
  }

  try {
    return await refreshAccessToken();
  } catch {
    return null;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  formData?: FormData;
  _retry?: boolean;
};

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

function getErrorCode(parsed: unknown, response: Response): number {
  if (typeof parsed === "object" && parsed !== null && isErrorEnvelope(parsed)) {
    return (
      parsed.code ??
      (typeof parsed.status === "number" ? parsed.status : response.status)
    );
  }
  return response.status;
}

function getErrorMessage(parsed: unknown, fallback: string): string {
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "message" in parsed &&
    typeof (parsed as { message: unknown }).message === "string"
  ) {
    return (parsed as { message: string }).message;
  }
  return fallback;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, formData, headers, _retry = false, ...rest } =
    options;

  const requestHeaders: HeadersInit = {
    ...(headers ?? {}),
  };

  if (!formData) {
    (requestHeaders as Record<string, string>)["Content-Type"] =
      "application/json";
  }

  if (auth) {
    const token = await getValidAccessToken();
    if (!token) {
      expireSession();
      throw new SessionExpiredError();
    }
    (requestHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  const parsed = await parseResponse(response);
  const errorCode = getErrorCode(parsed, response);

  // On 401, attempt one refresh + retry (unless this is already a retry or refresh call)
  if (
    auth &&
    errorCode === 401 &&
    !_retry &&
    path !== "/auth/refresh" &&
    getRefreshToken()
  ) {
    try {
      await refreshAccessToken();
      return apiRequest<T>(path, { ...options, _retry: true });
    } catch {
      expireSession();
      throw new SessionExpiredError();
    }
  }

  if (typeof parsed === "object" && parsed !== null && isErrorEnvelope(parsed)) {
    throw new ApiError(
      parsed.message,
      errorCode,
      parsed.details ?? parsed.data,
    );
  }

  if (!response.ok) {
    throw new ApiError(getErrorMessage(parsed, "Request failed"), errorCode);
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "data" in parsed &&
    (parsed as SuccessEnvelope<T>).data !== undefined
  ) {
    return (parsed as SuccessEnvelope<T>).data as T;
  }

  return parsed as T;
}

export async function connectInstagram(workspaceId: string): Promise<void> {
  const { authorization_url } = await apiRequest<{ authorization_url: string }>(
    `/workspaces/${workspaceId}/instagram/connect`,
  );
  window.location.href = authorization_url;
}

export const api = {
  auth: {
    register: (payload: {
      full_name: string;
      email: string;
      password: string;
    }) =>
      apiRequest<{ user: User }>("/auth/register", {
        method: "POST",
        body: payload,
        auth: false,
      }),

    login: (payload: { email: string; password: string }) =>
      apiRequest<{ user: User; tokens: AuthTokens }>("/auth/login", {
        method: "POST",
        body: payload,
        auth: false,
      }),

    me: () => apiRequest<User>("/auth/me"),

    refresh: () =>
      refreshAccessToken().then((access_token) => ({
        access_token,
        token_type: "bearer",
      })),

    logout: () => apiRequest<null>("/auth/logout", { method: "POST" }),
  },

  workspaces: {
    list: () => apiRequest<{ workspaces: Workspace[] }>("/workspaces"),

    get: (workspaceId: string) =>
      apiRequest<{ workspace: Workspace }>(`/workspaces/${workspaceId}`),

    create: (payload: WorkspaceCreate) =>
      apiRequest<{ workspace: Workspace }>("/workspaces", {
        method: "POST",
        body: payload,
      }),

    update: (workspaceId: string, payload: WorkspaceUpdate) =>
      apiRequest<{ workspace: Workspace }>(`/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: payload,
      }),

    upsertBusinessProfile: (
      workspaceId: string,
      payload: BusinessProfileUpsert,
    ) =>
      apiRequest<{ business_profile: BusinessProfile }>(
        `/workspaces/${workspaceId}/business-profile`,
        { method: "POST", body: payload },
      ),

    getBusinessProfile: (workspaceId: string) =>
      apiRequest<{ business_profile: BusinessProfile }>(
        `/workspaces/${workspaceId}/business-profile`,
      ),

    upsertAIConfiguration: (
      workspaceId: string,
      payload: AIConfigurationUpsert,
    ) =>
      apiRequest<{ ai_configuration: AIConfiguration }>(
        `/workspaces/${workspaceId}/ai-configuration`,
        { method: "POST", body: payload },
      ),

    getAIConfiguration: (workspaceId: string) =>
      apiRequest<{ ai_configuration: AIConfiguration }>(
        `/workspaces/${workspaceId}/ai-configuration`,
      ),

    uploadDocument: (workspaceId: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest<{ document: KnowledgeDocument }>(
        `/workspaces/${workspaceId}/knowledge-base/documents`,
        { method: "POST", formData },
      );
    },

    listDocuments: (workspaceId: string) =>
      apiRequest<{ documents: KnowledgeDocument[] }>(
        `/workspaces/${workspaceId}/knowledge-base/documents`,
      ),

    deleteDocument: (workspaceId: string, documentId: string) =>
      apiRequest<null>(
        `/workspaces/${workspaceId}/knowledge-base/documents/${documentId}`,
        { method: "DELETE" },
      ),
  },

  posts: {
    list: (workspaceId: string, status?: string) => {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      return apiRequest<{ posts: GeneratedPost[] }>(
        `/workspaces/${workspaceId}/generated-posts${query}`,
      );
    },

    get: (workspaceId: string, postId: string) =>
      apiRequest<GeneratedPostDetail>(
        `/workspaces/${workspaceId}/generated-posts/${postId}`,
      ),

    approve: (workspaceId: string, postId: string) =>
      apiRequest<{ post: GeneratedPost }>(
        `/workspaces/${workspaceId}/generated-posts/${postId}/review/approve`,
        { method: "POST" },
      ),

    reject: (workspaceId: string, postId: string, feedback?: string) =>
      apiRequest<{ post: GeneratedPost }>(
        `/workspaces/${workspaceId}/generated-posts/${postId}/review/reject`,
        { method: "POST", body: { feedback } },
      ),

    regenerate: (workspaceId: string, postId: string, feedback: string) =>
      apiRequest<{ post: GeneratedPost }>(
        `/workspaces/${workspaceId}/generated-posts/${postId}/review/regenerate`,
        { method: "POST", body: { feedback } },
      ),

    skip: (workspaceId: string, postId: string) =>
      apiRequest<{ post: GeneratedPost }>(
        `/workspaces/${workspaceId}/generated-posts/${postId}/review/skip`,
        { method: "POST" },
      ),

    edit: (
      workspaceId: string,
      postId: string,
      payload: { caption: string; hashtags?: string[]; cta?: string },
    ) =>
      apiRequest<{ post: GeneratedPost }>(
        `/workspaces/${workspaceId}/generated-posts/${postId}/review/edit`,
        { method: "POST", body: payload },
      ),

    delete: (workspaceId: string, postId: string) =>
      apiRequest<unknown>(
        `/workspaces/${workspaceId}/generated-posts/${postId}`,
        { method: "DELETE" },
      ),
  },

  notifications: {
    list: (workspaceId: string, unreadOnly = false, limit = 50) =>
      apiRequest<{ notifications: Notification[] }>(
        `/workspaces/${workspaceId}/notifications?unread_only=${unreadOnly}&limit=${limit}`,
      ),

    markRead: (workspaceId: string, notificationId: string) =>
      apiRequest<{ notification: Notification }>(
        `/workspaces/${workspaceId}/notifications/${notificationId}/read`,
        { method: "PATCH" },
      ),
  },

  instagram: {
    getConnection: (workspaceId: string) =>
      apiRequest<InstagramConnectionStatus>(
        `/workspaces/${workspaceId}/instagram`,
      ),

    connect: connectInstagram,
  },
};
