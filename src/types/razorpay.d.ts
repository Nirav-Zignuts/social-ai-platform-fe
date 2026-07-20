export type RazorpayCheckoutResponse = {
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
};

export type RazorpayCheckoutOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description?: string;
  theme?: { color?: string };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler?: (response: RazorpayCheckoutResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

export type RazorpayInstance = {
  open: () => void;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions,
) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export {};
