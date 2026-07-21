export type AdminSuccessMessage<T> = {
  status: "success" | number;
  message: string;
  data?: T;
  code?: number;
};

export type AdminErrorMessage = {
  status?: "error" | number;
  message?: string;
  code?: number;
  details?: unknown;
  data?: unknown;
  detail?: unknown;
};

export type AdminRequestOtpPayload = {
  email: string;
};

export type AdminRequestOtpResult = {
  expires_in_seconds?: number;
  resend_after_seconds?: number;
  cooldown_seconds?: number;
};

export type AdminVerifyOtpPayload = {
  email: string;
  code: string;
};

export type AdminVerifyOtpResult = {
  admin_session_token?: string;
  token?: string;
  access_token?: string;
  session_token?: string;
  expires_in_seconds?: number;
};
