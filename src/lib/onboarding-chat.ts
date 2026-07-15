import type { BusinessProfile, BusinessProfileUpsert } from "@/lib/types";

const sessionKey = (workspaceId: string) =>
  `onboarding_chat_session:${workspaceId}`;

export function getStoredOnboardingChatSessionId(
  workspaceId: string,
): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(sessionKey(workspaceId));
}

export function storeOnboardingChatSessionId(
  workspaceId: string,
  sessionId: string,
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(sessionKey(workspaceId), sessionId);
}

export function clearOnboardingChatSessionId(workspaceId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(sessionKey(workspaceId));
}

/** Map free-text synthesis_notes onto form field keys for highlight UI. */
export function getHighlightedProfileFields(
  notes: string | null | undefined,
): Set<string> {
  if (!notes) return new Set();
  const lower = notes.toLowerCase();
  const fields = [
    "business_name",
    "industry",
    "description",
    "target_audience",
    "brand_voice",
    "website_url",
    "prohibited_words",
    "required_keywords",
  ] as const;

  return new Set(
    fields.filter((field) => {
      const label = field.replace(/_/g, " ");
      return lower.includes(field) || lower.includes(label);
    }),
  );
}

export function synthesizedProfileToUpsert(
  profile: {
    business_name?: string | null;
    industry?: string | null;
    description?: string | null;
    target_audience?: string | null;
    brand_voice?: string | null;
    prohibited_words?: string[] | null;
    required_keywords?: string[] | null;
    website_url?: string | null;
  },
) {
  return {
    business_name: profile.business_name ?? undefined,
    industry: profile.industry ?? undefined,
    description: profile.description ?? undefined,
    target_audience: profile.target_audience ?? undefined,
    brand_voice: profile.brand_voice ?? undefined,
    prohibited_words: profile.prohibited_words ?? undefined,
    required_keywords: profile.required_keywords ?? undefined,
    website_url: profile.website_url ?? undefined,
  };
}

const PROFILE_FIELD_KEYS = [
  "business_name",
  "industry",
  "description",
  "target_audience",
  "brand_voice",
  "website_url",
  "prohibited_words",
  "required_keywords",
] as const;

function hasCollectedValue(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
}

/** Convert chat collected_fields into a partial profile for the form. */
export function collectedFieldsToUpsert(
  fields: Record<string, unknown>,
): BusinessProfileUpsert {
  const str = (key: string) => {
    const value = fields[key];
    if (value == null || Array.isArray(value)) return undefined;
    const text = String(value).trim();
    return text || undefined;
  };
  const arr = (key: string) => {
    const value = fields[key];
    if (!Array.isArray(value)) return undefined;
    const items = value.map(String).filter((item) => item.trim().length > 0);
    return items.length ? items : undefined;
  };

  return {
    business_name: str("business_name"),
    industry: str("industry"),
    description: str("description"),
    target_audience: str("target_audience"),
    brand_voice: str("brand_voice"),
    website_url: str("website_url"),
    prohibited_words: arr("prohibited_words"),
    required_keywords: arr("required_keywords"),
  };
}

export function getFromChatFieldKeys(
  fields: Record<string, unknown>,
): Set<string> {
  return new Set(
    PROFILE_FIELD_KEYS.filter((key) => hasCollectedValue(fields[key])),
  );
}

export function mergeProfileSources(
  base: BusinessProfileUpsert | BusinessProfile | null | undefined,
  fromChat: BusinessProfileUpsert,
): BusinessProfileUpsert {
  return {
    business_name: fromChat.business_name ?? base?.business_name ?? undefined,
    industry: fromChat.industry ?? base?.industry ?? undefined,
    description: fromChat.description ?? base?.description ?? undefined,
    target_audience:
      fromChat.target_audience ?? base?.target_audience ?? undefined,
    brand_voice: fromChat.brand_voice ?? base?.brand_voice ?? undefined,
    website_url: fromChat.website_url ?? base?.website_url ?? undefined,
    prohibited_words:
      fromChat.prohibited_words ?? base?.prohibited_words ?? undefined,
    required_keywords:
      fromChat.required_keywords ?? base?.required_keywords ?? undefined,
  };
}

/** Drop dismissed keys so cleared form fields stay empty. */
export function omitDismissedChatFields(
  profile: BusinessProfileUpsert,
  dismissed: Set<string>,
): BusinessProfileUpsert {
  if (dismissed.size === 0) return profile;
  const next: BusinessProfileUpsert = { ...profile };
  for (const key of dismissed) {
    delete next[key as keyof BusinessProfileUpsert];
  }
  return next;
}

export function serializeChatFieldValue(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(String).join("\0");
  return String(value);
}
