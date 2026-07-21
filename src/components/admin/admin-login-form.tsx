"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { AdminApiError, adminApi, readAdminToken } from "@/lib/admin-api";
import { isAdminSessionTokenValid } from "@/lib/admin-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DASHBOARD_PATH =
  "/ops-e246f9e101aae83bee9e9600-portal/dashboard";
const OTP_LENGTH = 6;
const DEFAULT_COOLDOWN_SECONDS = 60;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof AdminApiError ? error.message : fallback;
}

export function AdminLoginForm() {
  const router = useRouter();
  const { establishSession } = useAdminAuth();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function requestOtp() {
    setError(null);
    setIsRequesting(true);
    try {
      const result = await adminApi.auth.requestOtp({
        email: email.trim().toLowerCase(),
      });
      setStep("otp");
      setOtp(Array(OTP_LENGTH).fill(""));
      setCooldown(
        result.resend_after_seconds ??
          result.cooldown_seconds ??
          DEFAULT_COOLDOWN_SECONDS,
      );
      window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not send the access code."));
    } finally {
      setIsRequesting(false);
    }
  }

  async function verifyOtp() {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Enter the complete six-digit code.");
      return;
    }

    setError(null);
    setIsVerifying(true);
    try {
      const result = await adminApi.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        code,
      });
      const token = readAdminToken(result);
      if (!token) {
        throw new AdminApiError(
          "The server did not return an admin session token.",
          500,
        );
      }
      if (!isAdminSessionTokenValid(token)) {
        throw new AdminApiError(
          "The server returned an invalid admin session.",
          401,
        );
      }

      establishSession(token);
      router.replace(DASHBOARD_PATH);
    } catch (verifyError) {
      setError(errorMessage(verifyError, "The access code could not be verified."));
      setOtp(Array(OTP_LENGTH).fill(""));
      window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
    } finally {
      setIsVerifying(false);
    }
  }

  function updateDigit(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    setOtp((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    setError(null);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!digits) return;

    event.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    digits.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    setOtp(next);
    inputRefs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
  }

  return (
    <Card className="border-border-subtle/80 bg-bg-surface/95 shadow-2xl shadow-black/30">
      <CardHeader className="items-center text-center">
        <span className="mb-2 flex size-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
          {step === "email" ? (
            <ShieldCheck className="size-5" />
          ) : (
            <KeyRound className="size-5" />
          )}
        </span>
        <CardTitle>
          {step === "email" ? "Admin access" : "Enter access code"}
        </CardTitle>
        <CardDescription className="max-w-xs">
          {step === "email"
            ? "Use your authorized operations email to request a one-time code."
            : `We sent a six-digit code to ${email.trim().toLowerCase()}.`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-status-rejected">
              {error}
            </AlertDescription>
          </Alert>
        ) : null}

        {step === "email" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void requestOtp();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-9"
                  placeholder="admin@company.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isRequesting}
            >
              {isRequesting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending code
                </>
              ) : (
                "Request access code"
              )}
            </Button>
          </form>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void verifyOtp();
            }}
          >
            <fieldset>
              <legend className="sr-only">Six-digit access code</legend>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    value={digit}
                    onChange={(event) => updateDigit(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={handlePaste}
                    onFocus={(event) => event.currentTarget.select()}
                    className="h-12 w-11 px-0 text-center font-mono text-lg font-semibold sm:w-12"
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Code digit ${index + 1}`}
                    maxLength={1}
                    disabled={isVerifying}
                  />
                ))}
              </div>
            </fieldset>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isVerifying || otp.some((digit) => !digit)}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="animate-spin" />
                  Verifying
                </>
              ) : (
                "Verify and continue"
              )}
            </Button>

            <div className="flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary"
                onClick={() => {
                  setStep("email");
                  setOtp(Array(OTP_LENGTH).fill(""));
                  setError(null);
                }}
              >
                <ArrowLeft className="size-3.5" />
                Change email
              </button>
              <button
                type="button"
                className="text-accent hover:text-accent-hover disabled:cursor-not-allowed disabled:text-text-secondary"
                disabled={cooldown > 0 || isRequesting}
                onClick={() => void requestOtp()}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
