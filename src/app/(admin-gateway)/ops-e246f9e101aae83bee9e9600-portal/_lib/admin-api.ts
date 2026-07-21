"use client";

import { AdminApiError, adminApiRequest } from "@/lib/admin-api";

export { AdminApiError };
const request = adminApiRequest;

function queryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export type PageResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type UserSummary = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  workspace_count?: number;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
};

export type UserDetail = {
  user: UserSummary;
  workspaces: Array<{
    id: string;
    name: string;
    status: string;
    onboarding_status: string;
    timezone: string;
    created_at: string;
  }>;
  subscription: {
    id: string;
    status: string;
    plan_key: string;
    plan_name: string;
    workspace_limit: number;
    razorpay_subscription_id: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
};

export type UsageItem = {
  id: string;
  workspace_id: string;
  generated_post_id: string | null;
  agent_purpose: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  latency_ms: number | null;
  created_at: string;
};

export type UsageSummary = {
  period: string;
  from_date: string;
  totals: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost_usd: number;
    calls: number;
  };
  by_provider: Array<{
    provider: string;
    total_tokens: number;
    estimated_cost_usd: number;
    calls: number;
  }>;
  by_agent_purpose: Array<{
    agent_purpose: string;
    total_tokens: number;
    estimated_cost_usd: number;
    calls: number;
  }>;
};

export type ActionLog = {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  reason: string;
  payload_snapshot: unknown;
  created_at: string;
};

export type ContactEnquiry = {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  message: string;
  plan_interest: string | null;
  enquiry_type: string;
  user_id: string | null;
  status: "new" | "in_progress" | "resolved" | "spam";
  admin_notes: string | null;
  handled_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceDetail = {
  workspace: {
    id: string;
    owner_id: string;
    name: string;
    slug: string;
    status: string;
    onboarding_status: string;
    timezone: string;
    preferred_post_time: string | null;
    generation_lead_hours: number;
    last_generation_date: string | null;
    created_at: string;
  };
  business_profile: Record<string, unknown> | null;
  ai_configuration: Record<string, unknown> | null;
  knowledge_documents: { count: number; by_status: Record<string, number> };
  recent_generated_posts: Array<{
    id: string;
    generation_cycle_id: string;
    content_type: string;
    status: string;
    reviewer_score: number | null;
    regenerate_count: number;
    scheduled_for: string | null;
    created_at: string;
  }>;
  recent_publishing_jobs: Array<{
    id: string;
    post_id: string;
    status: string;
    attempt_count: number;
    last_error: string | null;
    published_at: string | null;
    created_at: string;
  }>;
  instagram_connections: Array<Record<string, unknown>>;
  recent_ai_usage: UsageItem[];
};

export type GenerationRun = {
  generation_cycle_id: string;
  post_id: string;
  status: string;
  reviewer_score: number | null;
  reviewer_notes: string | null;
  regenerate_count: number;
  created_at: string;
  updated_at: string;
};

export const adminApi = {
  users: {
    list: (params: { search?: string; limit: number; offset: number }) =>
      request<PageResult<UserSummary>>(`/users${queryString(params)}`),
    detail: (id: string) => request<UserDetail>(`/users/${id}`),
    setPlan: (id: string, plan_key: string, reason: string) =>
      request(`/users/${id}/set-plan`, {
        method: "POST",
        body: { plan_key, reason },
      }),
  },
  subscriptions: {
    forceStatus: (id: string, status: string, reason: string) =>
      request(`/subscriptions/${id}/force-status`, {
        method: "POST",
        body: { status, reason },
      }),
  },
  workspaces: {
    detail: (id: string) => request<WorkspaceDetail>(`/workspaces/${id}`),
    generationRuns: (id: string, limit = 50) =>
      request<{ items: GenerationRun[] }>(
        `/workspaces/${id}/generation-runs${queryString({ limit })}`,
      ),
    unlock: (id: string, reason: string) =>
      request(`/workspaces/${id}/unlock`, {
        method: "POST",
        body: { reason },
      }),
  },
  publishingJobs: {
    retry: (id: string, reason: string) =>
      request(`/publishing-jobs/${id}/retry`, {
        method: "POST",
        body: { reason },
      }),
  },
  usage: {
    list: (params: Record<string, string | number | undefined>) =>
      request<PageResult<UsageItem>>(`/ai-usage${queryString(params)}`),
    summary: (period: "7d" | "30d") =>
      request<UsageSummary>(`/ai-usage/summary?period=${period}`),
  },
  actionLogs: {
    list: (params: {
      action_type?: string;
      target_type?: string;
      limit: number;
      offset: number;
    }) =>
      request<PageResult<ActionLog>>(`/action-logs${queryString(params)}`),
  },
  enquiries: {
    list: (params: {
      status?: string;
      enquiry_type?: string;
      sort_order?: string;
      limit: number;
      offset: number;
    }) =>
      request<PageResult<ContactEnquiry>>(
        `/contact-enquiries${queryString(params)}`,
      ),
    update: (
      id: string,
      payload: { status?: string; admin_notes?: string },
    ) =>
      request<ContactEnquiry>(`/contact-enquiries/${id}`, {
        method: "PATCH",
        body: { ...payload },
      }),
    delete: (id: string) =>
      request(`/contact-enquiries/${id}`, { method: "DELETE" }),
  },
};
