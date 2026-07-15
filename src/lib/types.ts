export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface User {
  id: string;
  email: string;
  full_name: string;
  status: UserStatus;
  avatar_url: string | null;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type OnboardingStatus =
  | "workspace_created"
  | "profile_added"
  | "knowledge_added"
  | "ai_configured"
  | "completed";

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  timezone: string;
  preferred_post_time: string | null;
  require_human_approval: boolean;
  onboarding_status: OnboardingStatus;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreate {
  name: string;
  timezone?: string;
  preferred_post_time?: string;
  require_human_approval?: boolean;
}

export interface WorkspaceUpdate {
  name?: string;
  timezone?: string;
  preferred_post_time?: string;
  require_human_approval?: boolean;
}

export interface BusinessProfile {
  id: string;
  workspace_id: string;
  business_name: string | null;
  industry: string | null;
  description: string | null;
  target_audience: string | null;
  brand_voice: string | null;
  prohibited_words: string[] | null;
  required_keywords: string[] | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfileUpsert {
  business_name?: string;
  industry?: string;
  description?: string;
  target_audience?: string;
  brand_voice?: string;
  prohibited_words?: string[];
  required_keywords?: string[];
  website_url?: string;
}

/** Draft returned by onboarding chat synthesis — review in FE, then upsert. */
export interface SynthesizedBusinessProfile extends BusinessProfileUpsert {
  synthesis_notes?: string | null;
}

export type OnboardingChatSessionStatus = "active" | "completed" | "abandoned";

export interface OnboardingChatMessage {
  id: string;
  role: "assistant" | "user" | string;
  content: string;
  quick_replies: string[] | null;
  created_at: string;
}

export interface OnboardingChatStart {
  session_id: string;
  message: string;
  quick_replies: string[];
}

export interface OnboardingChatTurn {
  message: string;
  quick_replies: string[];
  is_complete: boolean;
  synthesized_profile: SynthesizedBusinessProfile | null;
  turn_count: number;
  collected_fields: Record<string, unknown>;
  forced_synthesis: boolean;
}

export interface OnboardingChatSession {
  session_id: string;
  workspace_id: string;
  status: OnboardingChatSessionStatus;
  collected_fields: Record<string, unknown>;
  turn_count: number;
  started_at: string;
  completed_at: string | null;
  messages: OnboardingChatMessage[];
}

export type KnowledgeDocumentStatus =
  | "uploaded"
  | "processing"
  | "indexed"
  | "failed";

export interface KnowledgeDocument {
  id: string;
  workspace_id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size_bytes: number | null;
  status: KnowledgeDocumentStatus;
  error_message: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIConfiguration {
  id: string;
  workspace_id: string;
  content_style: string | null;
  caption_length: string | null;
  hashtag_count: number;
  emoji_usage: string;
  cta_style: string | null;
  custom_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIConfigurationUpsert {
  content_style?: string;
  caption_length?: string;
  hashtag_count?: number;
  emoji_usage?: string;
  cta_style?: string;
  custom_instructions?: string;
}

export type GeneratedPostStatus =
  | "DRAFT"
  | "REVIEWER_PASSED"
  | "REVIEWER_FAILED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED"
  | "FAILED"
  | "SKIPPED";

export type PostReviewAction =
  | "APPROVE"
  | "REJECT"
  | "REGENERATE"
  | "SKIP"
  | "EDIT";

export interface PostReview {
  id: string;
  post_id: string;
  reviewed_by: string | null;
  action: PostReviewAction;
  feedback: string | null;
  edited_caption: string | null;
  edited_hashtags: string[] | null;
  edited_cta: string | null;
  created_at: string;
}

export interface GeneratedPost {
  id: string;
  workspace_id: string;
  generation_cycle_id: string;
  content_type: string | null;
  caption: string | null;
  hashtags: string[] | null;
  cta: string | null;
  image_url: string | null;
  status: GeneratedPostStatus;
  reviewer_score: number | null;
  reviewer_notes: string | null;
  regenerate_count: number;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
  reviews: PostReview[];
}

export interface GeneratedPostDetail {
  post: GeneratedPost;
  review_link: string;
  insights: PostInsights | null;
}

export interface PostInsights {
  ig_media_id: string | null;
  permalink: string | null;
  like_count: number | null;
  comments_count: number | null;
  saved_count: number | null;
  shares_count: number | null;
  reach: number | null;
  views: number | null;
  total_interactions: number | null;
  profile_visits: number | null;
  fetched_at: string | null;
}

export type ConnectedAccountStatus = "connected" | "disconnected" | "error";

export interface ConnectedAccount {
  id: string;
  workspace_id: string;
  provider: string;
  provider_account_id: string;
  provider_username: string | null;
  display_name: string | null;
  page_id: string | null;
  instagram_business_account_id: string | null;
  status: ConnectedAccountStatus;
  connected_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstagramAccountMetrics {
  followers_count: number | null;
  follows_count: number | null;
  media_count: number | null;
  biography: string | null;
  profile_picture_url: string | null;
  username: string | null;
  name: string | null;
}

export interface InstagramConnectionStatus {
  connected: boolean;
  account: ConnectedAccount | null;
  metrics: InstagramAccountMetrics | null;
}

export type NotificationType =
  | "post_ready_for_review"
  | "post_approved"
  | "post_rejected"
  | "post_auto_approved";

export interface Notification {
  id: string;
  user_id: string;
  workspace_id: string;
  post_id: string | null;
  type: NotificationType;
  channel: string;
  read_at: string | null;
  sent_at: string | null;
  payload: {
    message: string;
    review_link?: string;
  } | null;
  created_at: string;
}
