import type {
  AIConfiguration,
  AIConfigurationUpsert,
  AuthTokens,
  BusinessProfile,
  BusinessProfileUpsert,
  GeneratedPost,
  GeneratedPostDeleteResult,
  GeneratedPostDetail,
  InstagramConnectionStatus,
  InstagramDisconnectResult,
  KnowledgeDocument,
  Notification,
  OnboardingChatSession,
  OnboardingChatStart,
  OnboardingChatTurn,
  User,
  Workspace,
  WorkspaceCreate,
  WorkspaceDeleteResult,
  WorkspaceUpdate,
  AnalyticsOverview,
  AnalyticsPeriod,
  AnalyticsPostsResult,
  AnalyticsPostsSortBy,
  AnalyticsSortOrder,
  AnalyticsTrend,
  AnalyticsTrendMetric,
  ContentTypeBreakdown,
  QualityCorrelation,
  BillingCancelResult,
  BillingCheckoutSession,
  BillingSelectActiveResult,
  BillingStatus,
  BillingTransactionsPage,
  BillingTransactionsQuery,
  ContactEnquiryCreate,
  SupportIssueCreate,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
const API_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

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
  const accessToken = getAccessToken();
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
  apiOrigin?: boolean;
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
  const {
    body,
    auth = true,
    formData,
    headers,
    apiOrigin = false,
    _retry = false,
    ...rest
  } = options;

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

  const response = await fetch(`${apiOrigin ? API_ORIGIN : API_BASE}${path}`, {
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
  public: {
    createContactEnquiry: (payload: ContactEnquiryCreate) =>
      apiRequest<unknown>("/public/contact-enquiries", {
        method: "POST",
        body: payload,
        auth: false,
        apiOrigin: true,
      }),
  },

  support: {
    createIssue: (payload: SupportIssueCreate) =>
      apiRequest<unknown>("/support/issues", {
        method: "POST",
        body: payload,
      }),
  },

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

    verifyEmail: (token: string) =>
      apiRequest<null>("/auth/verify-email", {
        method: "POST",
        body: { token },
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

    delete: (workspaceId: string) =>
      apiRequest<WorkspaceDeleteResult>(`/workspaces/${workspaceId}`, {
        method: "DELETE",
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

  onboardingChat: {
    start: (workspaceId: string) =>
      apiRequest<OnboardingChatStart>(
        `/workspaces/${workspaceId}/onboarding-chat/start`,
        { method: "POST" },
      ),

    sendMessage: (workspaceId: string, sessionId: string, content: string) =>
      apiRequest<OnboardingChatTurn>(
        `/workspaces/${workspaceId}/onboarding-chat/${sessionId}/message`,
        { method: "POST", body: { content } },
      ),

    getSession: (workspaceId: string, sessionId: string) =>
      apiRequest<OnboardingChatSession>(
        `/workspaces/${workspaceId}/onboarding-chat/${sessionId}`,
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

    regenerate: (
      workspaceId: string,
      postId: string,
      feedback: string,
      regenerateImage: boolean,
    ) =>
      apiRequest<{ post: GeneratedPost }>(
        `/workspaces/${workspaceId}/generated-posts/${postId}/review/regenerate`,
        {
          method: "POST",
          body: { feedback, regenerate_image: regenerateImage },
        },
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

    delete: (
      workspaceId: string,
      postId: string,
      options?: { syncWithInstagram?: boolean },
    ) => {
      const sync = options?.syncWithInstagram
        ? "?sync_with_instagram=true"
        : "";
      return apiRequest<GeneratedPostDeleteResult>(
        `/workspaces/${workspaceId}/generated-posts/${postId}${sync}`,
        { method: "DELETE" },
      );
    },
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

    disconnect: (workspaceId: string) =>
      apiRequest<InstagramDisconnectResult>(
        `/workspaces/${workspaceId}/instagram`,
        { method: "DELETE" },
      ),
  },

  analytics: {
    overview: (workspaceId: string, period: AnalyticsPeriod = "30d") =>
      apiRequest<AnalyticsOverview>(
        `/workspaces/${workspaceId}/analytics/overview?period=${period}`,
      ),

    trend: (
      workspaceId: string,
      metric: AnalyticsTrendMetric,
      period: AnalyticsPeriod = "30d",
    ) =>
      apiRequest<AnalyticsTrend>(
        `/workspaces/${workspaceId}/analytics/trend?metric=${metric}&period=${period}`,
      ),

    posts: (
      workspaceId: string,
      options?: {
        sortBy?: AnalyticsPostsSortBy;
        order?: AnalyticsSortOrder;
        contentType?: string;
        limit?: number;
        offset?: number;
      },
    ) => {
      const params = new URLSearchParams();
      params.set("sort_by", options?.sortBy ?? "published_at");
      params.set("order", options?.order ?? "desc");
      params.set("limit", String(options?.limit ?? 20));
      params.set("offset", String(options?.offset ?? 0));
      if (options?.contentType) {
        params.set("content_type", options.contentType);
      }
      return apiRequest<AnalyticsPostsResult>(
        `/workspaces/${workspaceId}/analytics/posts?${params.toString()}`,
      );
    },

    contentTypeBreakdown: (
      workspaceId: string,
      period: AnalyticsPeriod = "30d",
    ) =>
      apiRequest<ContentTypeBreakdown>(
        `/workspaces/${workspaceId}/analytics/content-type-breakdown?period=${period}`,
      ),

    qualityCorrelation: (
      workspaceId: string,
      period: AnalyticsPeriod = "30d",
    ) =>
      apiRequest<QualityCorrelation>(
        `/workspaces/${workspaceId}/analytics/quality-correlation?period=${period}`,
      ),
  },

  billing: {
    status: () => apiRequest<BillingStatus>("/billing/status"),

    subscribe: (planKey: string) =>
      apiRequest<BillingCheckoutSession>("/billing/subscribe", {
        method: "POST",
        body: { plan_key: planKey },
      }),

    cancel: (payload?: { immediate?: boolean }) =>
      apiRequest<BillingCancelResult>("/billing/cancel", {
        method: "POST",
        body: { immediate: payload?.immediate ?? false },
      }),

    selectActiveWorkspaces: (workspaceIds: string[]) =>
      apiRequest<BillingSelectActiveResult>(
        "/billing/workspaces/select-active",
        {
          method: "POST",
          body: { workspace_ids: workspaceIds },
        },
      ),

    transactions: (query: BillingTransactionsQuery = {}) => {
      const params = new URLSearchParams();
      for (const eventType of query.eventTypes ?? []) {
        params.append("event_type", eventType);
      }
      if (query.processed === true) params.set("processed", "true");
      if (query.processed === false) params.set("processed", "false");
      if (query.dateFrom) params.set("date_from", query.dateFrom);
      if (query.dateTo) params.set("date_to", query.dateTo);
      params.set("page", String(query.page ?? 1));
      params.set("page_size", String(query.pageSize ?? 25));
      const qs = params.toString();
      return apiRequest<BillingTransactionsPage>(
        `/billing/transactions${qs ? `?${qs}` : ""}`,
      );
    },
  },
};
